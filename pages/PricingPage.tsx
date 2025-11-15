
import React from 'react';

const pricingData = [
  { service: "Applying for an IRP and IFTA accounts/plate", price: "Service Fee + $300+ government fee" },
  { service: "1 business day getting a plate", price: "$500+ government fee" },
  { service: "Applying for an Oregon ODOT account", price: "$150" },
  { service: "Adding unit to ODOT account", price: "$30" },
  { service: "Applying for a Kentucky HUT account", price: "$100" },
  { service: "Applying for New Mexico HUT account", price: "$60" },
  { service: "Oregon Monthly report", price: "$40+$10 per truck" },
  { service: "Kentucky Quarterly report", price: "$40+$10 per truck" },
  { service: "New Mexico Quarterly report", price: "$40+$10 per truck" },
  { service: "New York Quarterly report", price: "$40+$10 per truck" },
  { service: "IFTA quarterly reports", price: "$100+$50 per truck + $20 adding an IFTA decal" },
  { service: "Corporation filings", price: "$60" },
  { service: "UCR yearly license", price: "$50+government fee" },
  { service: "FMCSA yearly MCS-150 form update", price: "$50" },
  { service: "Clean truck permit", price: "$50+government fee" },
  { service: "BOC-3 filing", price: "$30+government fee" },
  { service: "Drug and Alcohol", price: "$60 (New account)+$20 adding a driver each time + test fee" },
  { service: "Clearing house", price: "$60 (New account)+$20 adding a driver each time" },
  { service: "Supervisor training course", price: "$250 + course fee" },
  { service: "Lease agreement", price: "$30" },
  { service: "MC certificate", price: "$50" },
  { service: "HVUTAX Form 2290", price: "$100 up to 3 vehicles" },
  { service: "CT permit", price: "$50 New account + $40 Monthly" },
  { service: "TWIC Card", price: "$300 + government fee" },
  { service: "UIIA Intermodal (railyard - BNSF, Flexi Van, Northfolk and etc.)", price: "$300 + government fee" },
  { service: "UIIA adding drivers", price: "$30 per driver" },
  { service: "UIIA adding vehicles", price: "$30 per vehicle" },
  { service: "SCAC Code", price: "$100 + government fee" },
  { service: "Driver Qualification files", price: "$100" },
  { service: "Motor Vehicle records", price: "$20 + government fee" },
  { service: "SAAFETY AUDIT Driver/Owner Statements", price: "$500 + filings" },
];

const PricingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-mfleet-blue-dark sm:text-5xl sm:tracking-tight lg:text-6xl">
            Our Pricing
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Transparent pricing for all our consulting and filing services. No hidden fees.
          </p>
        </div>

        <div className="mt-12">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow-2xl overflow-hidden border-b border-gray-200 sm:rounded-2xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-mfleet-blue-dark">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Service
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Fee
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pricingData.map((item, index) => (
                        <tr key={item.service} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                          <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900">
                            {item.service}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                            {item.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
         <div className="mt-12 text-center text-gray-500">
            <p>Please note: "Government fee" is separate from our service fee and is paid directly to the respective government agency.</p>
            <p className="mt-2">For custom packages or questions, please <a href="/#contact" className="font-medium text-mfleet-blue hover:text-mfleet-blue-dark">contact us</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
