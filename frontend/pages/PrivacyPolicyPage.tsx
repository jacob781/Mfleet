import React, { useEffect } from 'react';
import SEO from '../components/SEO';

const PrivacyPolicyPage: React.FC = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <SEO
                title="Privacy Policy"
                description="Privacy Policy for Mfleet Consulting Services. Learn how we collect, use, and protect your personal information."
                canonicalUrl="https://mfleet.org/privacy-policy"
            />


            <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">PRIVACY POLICY</h1>
                    <p className="text-gray-500 mb-8">Last updated January 01, 2026</p>

                    <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                        <p>
                            This Privacy Notice for <strong>Mfleet LLC</strong> ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"),
                            describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Visit our website at <a href="https://mfleet.org" className="text-mfleet-blue hover:underline">mfleet.org</a>, or any website of ours that links to this Privacy Notice</li>
                            <li>Engage with us in other related ways, including any marketing or events</li>
                        </ul>

                        <p>
                            <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices.
                            We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services.
                            If you still have any questions or concerns, please contact us at <a href="mailto:contact@mfleet.org" className="text-mfleet-blue hover:underline">contact@mfleet.org</a>.
                        </p>

                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">SUMMARY OF KEY POINTS</h2>
                            <p className="italic mb-4">
                                This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by reading the full sections below.
                            </p>
                            <ul className="space-y-4">
                                <li><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
                                <li><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
                                <li><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</li>
                                <li><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</li>
                                <li><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</li>
                                <li><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information.</li>
                                <li><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</li>
                                <li><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</li>
                            </ul>
                        </div>

                        <div className="mt-12 space-y-12">
                            <section id="infocollect">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal information you disclose to us</h3>
                                <p className="mb-4"><strong>In Short:</strong> We collect personal information that you provide to us.</p>
                                <p className="mb-4">
                                    We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services,
                                    when you participate in activities on the Services, or otherwise when you contact us.
                                </p>
                                <p className="mb-4"><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Names</li>
                                    <li>Email addresses</li>
                                </ul>
                                <p className="mt-4"><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
                                <p className="mt-4">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>
                            </section>

                            <section id="infouse">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                                <p className="mb-4"><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>
                                <p className="mb-4">We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>To deliver and facilitate delivery of services to the user.</li>
                                    <li>To respond to user inquiries/offer support to users.</li>
                                    <li>To send administrative information to you.</li>
                                    <li>To fulfill and manage your orders.</li>
                                    <li>To request feedback.</li>
                                    <li>To send you marketing and promotional communications.</li>
                                </ul>
                            </section>

                            <section id="legalbases">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
                                <p className="mb-4">
                                    <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
                                </p>
                                <p>If you are located in Canada, this section applies to you.</p>
                                <p className="mt-2">
                                    We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.
                                </p>
                            </section>

                            <section id="whoshare">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                                <p className="mb-4"><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</p>
                                <p className="mb-4">We may need to share your personal information in the following situations:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                                </ul>
                            </section>

                            <section id="inforetain">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                                <p className="mb-4"><strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
                                <p>
                                    We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
                                    When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                                </p>
                            </section>

                            <section id="infosafe">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
                                <p className="mb-4"><strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.</p>
                                <p>
                                    We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                                </p>
                            </section>

                            <section id="infominors">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">7. DO WE COLLECT INFORMATION FROM MINORS?</h2>
                                <p className="mb-4"><strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</p>
                                <p>
                                    We do not knowingly collect, solicit data from, or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.
                                </p>
                            </section>

                            <section id="privacyrights">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">8. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                                <p className="mb-4"><strong>In Short:</strong> You may review, change, or terminate your account at any time.</p>
                                <p className="mb-4">
                                    In some regions (like Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
                                </p>
                                <p className="mb-4">
                                    <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us.
                                </p>
                            </section>

                            <section id="DNT">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">9. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                                <p>
                                    Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals.
                                </p>
                            </section>

                            <section id="uslaws">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">10. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
                                <p className="mb-4">
                                    <strong>In Short:</strong> If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information.
                                </p>
                                <p>
                                    We have not disclosed, sold, or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We will not sell or share personal information in the future belonging to website visitors, users, and other consumers.
                                </p>
                                <div className="mt-8 overflow-x-auto">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories of Personal Information</h3>
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Category</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Examples</th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">A. Identifiers</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-center font-semibold">YES</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">B. Personal information categories listed in the California Customer Records statute</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Name, contact information, education, employment, employment history, and financial information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">C. Protected classification characteristics under state or federal law</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">D. Commercial information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Transaction information, purchase history, financial details, and payment information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">E. Biometric information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Fingerprints and voiceprints</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">F. Internet or other similar network activity</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">G. Geolocation data</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Device location</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">H. Audio, electronic, sensory, or similar information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Images and audio, video or call recordings created in connection with our business activities</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">I. Professional or employment-related information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">J. Education Information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Student records and directory information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">K. Inferences drawn from other personal information</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual’s preferences and characteristics</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">NO</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section id="policyupdates">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">11. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                                <p><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
                                <p>
                                    We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                                </p>
                            </section>

                            <section id="contact">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                                <p className="mb-4">If you have questions or comments about this notice, you may email us at <a href="mailto:contact@mfleet.org" className="text-mfleet-blue hover:underline">contact@mfleet.org</a> or contact us by post at:</p>
                                <address className="not-italic text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 inline-block">
                                    <strong>Mfleet LLC</strong><br />
                                    __________<br />
                                    __________<br />
                                    United States
                                </address>
                            </section>

                            <section id="request">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                                <p>
                                    Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. To request to review, update, or delete your personal information, please fill out and submit a data subject access request or contact us via email.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default PrivacyPolicyPage;
