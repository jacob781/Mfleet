"""Telegram bot: registers groups and lets drivers link themselves, in the group.

Run as its own service (long polling):  python bot.py
Sending reminders is NOT here — that runs from cron via notify_telegram, so a
stopped bot never costs anybody a reminder.

Everything happens in the group chat; drivers are never asked to open a private
chat. Free-text answers come back through ForceReply, which is what lets the bot
read them while its privacy mode stays ON — it never sees unrelated chatter.

The half-filled registration lives in the TelegramLink row rather than in memory,
so a restart mid-form loses nothing and a manager can see who started but stopped.
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ChatMemberStatus
from aiogram.types import (
    CallbackQuery,
    ChatMemberUpdated,
    ForceReply,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)
from dotenv import load_dotenv
from sqlmodel import Session, select

import tg_linking
from database import get_engine
from models import (
    TG_CONFLICT,
    TG_DRAFT,
    TG_LINKED,
    Company,
    TelegramGroup,
    TelegramLink,
)

# The questions double as the state marker: an incoming reply is matched against the
# text it quotes, so no FSM storage is needed.
Q_NAME = "Напишите имя и фамилию (как в правах):"
Q_DOB = "Дата рождения в формате ММ/ДД/ГГГГ:"
Q_TRUCK = "Юнит-номер трака или последние 4 цифры VIN (или напишите «нет»):"

ASK = ForceReply(selective=True)

log = logging.getLogger("mfleet.bot")
dp = Dispatcher()


def _companies_kb(session: Session) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=c.name, callback_data=f"co:{c.id}")]
        for c in session.exec(select(Company).order_by(Company.name)).all()
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


DRIVER_KB = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="🚛 Я водитель", callback_data="drv")],
])


@dp.my_chat_member()
async def on_added(event: ChatMemberUpdated) -> None:
    """Bot added to a group -> ask whoever added it which company this group serves."""
    if event.new_chat_member.status not in (ChatMemberStatus.MEMBER, ChatMemberStatus.ADMINISTRATOR):
        return
    with Session(get_engine()) as s:
        group = s.get(TelegramGroup, event.chat.id)
        if group is None:
            group = TelegramGroup(chat_id=event.chat.id)
            s.add(group)
        group.title = event.chat.title
        s.commit()
        kb = _companies_kb(s)
    if not kb.inline_keyboard:
        await event.bot.send_message(event.chat.id, "В системе нет компаний — сначала заведите их в админке.")
        return
    await event.bot.send_message(event.chat.id, "Какой компании принадлежит эта группа?", reply_markup=kb)


@dp.callback_query(F.data.startswith("co:"))
async def on_company(cb: CallbackQuery) -> None:
    company_id = int(cb.data.split(":", 1)[1])
    with Session(get_engine()) as s:
        group = s.get(TelegramGroup, cb.message.chat.id)
        if group is None:
            group = TelegramGroup(chat_id=cb.message.chat.id, title=cb.message.chat.title)
            s.add(group)
        group.company_id = company_id
        group.registered_by = cb.from_user.id
        s.commit()
        name = s.get(Company, company_id).name
    await cb.message.edit_text(f"Группа привязана к компании: {name}")
    await cb.message.answer(
        "Водители, нажмите кнопку — бот будет напоминать вам об истекающих документах.",
        reply_markup=DRIVER_KB,
    )
    await cb.answer("Готово")


@dp.callback_query(F.data == "drv")
async def on_driver_tap(cb: CallbackQuery) -> None:
    """Start (or restart) a registration. The tap already gives us the account id."""
    with Session(get_engine()) as s:
        link = s.exec(
            select(TelegramLink).where(TelegramLink.tg_user_id == cb.from_user.id)
        ).first()
        if link and link.status == TG_LINKED:
            await cb.answer("Вы уже зарегистрированы", show_alert=True)
            return
        if link is None:
            link = TelegramLink(tg_user_id=cb.from_user.id)
            s.add(link)
        link.tg_username = cb.from_user.username
        link.tg_name = cb.from_user.full_name
        link.home_chat_id = cb.message.chat.id
        link.status = TG_DRAFT
        s.commit()
    await cb.message.answer(Q_NAME, reply_markup=ASK)
    await cb.answer()


@dp.message(F.reply_to_message)
async def on_answer(msg: Message) -> None:
    """Handle a reply to one of our questions; ignore replies to anything else."""
    asked = (msg.reply_to_message.text or "").strip()
    if asked not in (Q_NAME, Q_DOB, Q_TRUCK):
        return
    text = (msg.text or "").strip()

    with Session(get_engine()) as s:
        link = s.exec(
            select(TelegramLink).where(TelegramLink.tg_user_id == msg.from_user.id)
        ).first()
        if link is None or link.status != TG_DRAFT:
            await msg.reply("Сначала нажмите «Я водитель».")
            return

        if asked == Q_NAME:
            if len(text.split()) < 2:
                await msg.reply("Нужны имя и фамилия. " + Q_NAME, reply_markup=ASK)
                return
            link.claimed_name = text
            s.commit()
            await msg.reply(Q_DOB, reply_markup=ASK)
            return

        if asked == Q_DOB:
            dob = tg_linking.parse_dob(text)
            if dob is None:
                await msg.reply("Не понял дату. " + Q_DOB, reply_markup=ASK)
                return
            link.claimed_dob = dob
            s.commit()
            await msg.reply(Q_TRUCK, reply_markup=ASK)
            return

        # Q_TRUCK — the last step; resolve the truck, then the driver.
        group = s.get(TelegramGroup, link.home_chat_id)
        company_id = group.company_id if group else None
        truck, truck_note = None, ""
        if text.lower() not in ("нет", "no", "-"):
            found = tg_linking.find_trucks(s, text)
            if len(found) > 1:
                await msg.reply(
                    "Нашлось несколько траков. Уточните — введите 4 цифры VIN:",
                    reply_markup=ASK,
                )
                return
            if not found:
                link.claimed_truck = text
                truck_note = f"truck '{text}' not found"
            else:
                truck = found[0]
                if company_id is not None and truck.company_id != company_id:
                    truck_note = f"truck {truck.id} belongs to another company"

        note = tg_linking.resolve_driver(s, link, company_id)
        if truck is not None and link.driver_id:
            tg_linking.assign_truck(s, truck.id, link.driver_id)
        link.note = "; ".join(n for n in (note, truck_note) if n) or None
        status = link.status
        s.commit()

    if status == TG_CONFLICT:
        await msg.reply("Записал, но нужна проверка менеджера — он свяжется с вами.")
    else:
        await msg.reply("Готово! Буду напоминать здесь, когда документы подходят к сроку.")


async def main() -> None:
    load_dotenv()
    logging.basicConfig(level=logging.INFO)
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise SystemExit("TELEGRAM_BOT_TOKEN is not set")
    bot = Bot(token)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
