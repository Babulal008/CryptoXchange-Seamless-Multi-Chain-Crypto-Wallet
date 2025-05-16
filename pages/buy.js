"use client";
import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const providers = [
  {
    name: "MoonPay",
    description: "Fast and simple",
    buyUrl: "https://www.moonpay.com/",
    sellUrl:
      "https://sell.moonpay.com/?apiKey=pk_live_Tdc0BhIo7uIk8v9MOtWNxVJHr1WCEm&baseCurrencyCode=sol&refundWalletAddress=DqwnHPEoCGWv5jn3C5AkWqcVwmTTayXLejMPGbspuoGW&colorCode=%233cc77a&signature=LvEtLCfaqcfOXVUd8dS1igzAJS8rMakGs1WscblyI3E%3D",
    color: "#6D0EEB",
  },
  {
    name: "Onramper",
    description: "Aggregator",
    buyUrl: "https://onramper.com/",
    sellUrl: "https://onramper.com/sell",
    color: "#000",
  },
  {
    name: "Bitnovo",
    description: "Get more crypto!",
    buyUrl: "https://www.bitnovo.com/",
    sellUrl: "https://www.bitnovo.com/en/sell-crypto",
    color: "#0E1C36",
  },
  {
    name: "Paybis",
    description: "No KYC, low fees",
    buyUrl: "https://paybis.com/",
    sellUrl: "https://paybis.com/sell-bitcoin/",
    color: "#4F46E5",
  },
];

const BuySolScreen = () => {
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [modalVisible, setModalVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleTransactionPress = (url) => {
    setWebViewUrl(url);
    setModalVisible(true);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-100 via-blue-100 to-purple-200">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Buy/Sell SOL</h2>

        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="border border-gray-300 rounded-md p-2 mb-6 w-full shadow-sm focus:ring-2 focus:ring-green-400"
        >
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
          <option value="Canada">Canada</option>
        </select>

        <div className="space-y-6">
          {providers.map((item, index) => (
            <div
              key={item.name}
              className="flex justify-between items-center bg-white p-4 rounded-xl shadow hover:shadow-md transition-all border"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div>
                <h3 className="text-lg font-semibold" style={{ color: item.color }}>
                  {item.name}
                </h3>
                <p className="text-gray-500">{item.description}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTransactionPress(item.buyUrl)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg shadow"
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTransactionPress(item.sellUrl)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow"
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col animate-fadeIn">
          <button
            onClick={() => setModalVisible(false)}
            className="bg-white text-black font-semibold py-3 text-center"
          >
            Close
          </button>
          <iframe
            src={webViewUrl}
            className="flex-1 w-full"
            style={{ border: "none" }}
          />
        </div>
      )}
    </div>
  );
};

export default BuySolScreen;
