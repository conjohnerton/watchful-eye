import React, { useState } from "react";
import Blockie from "react-blockies";

const Nav = ({ isWalletConnected, walletAddress, connectToNetwork }) => {
  const [copied, setCopied] = useState(false);

  function showCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function copyToClipboard() {
    const walletAddressText = document.getElementById("walletAddress")
      .innerText;

    const el = document.createElement("textarea");
    el.value = walletAddressText;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);

    document.execCommand("copy");
    showCopied();
  }

  const walletConnectionBox = isWalletConnected ? (
    <div
      onClick={copyToClipboard}
      className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
    >
      <button
        disabled={true}
        className="flex space-x-2 border-white hover:shadow-lg border-5 pl-5 pr-5 pt-1 pb-1 rounded text-white focus:outline-none"
      >
        {copied ? <p className="text-green-500">Copied!</p> : null}
        <Blockie seed={walletAddress} size={6} />{" "}
        <div id="walletAddress">{walletAddress}</div>
      </button>
    </div>
  ) : (
    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
      <button
        onClick={connectToNetwork}
        className="bg-red-500 pl-5 pr-5 pt-1 pb-1 rounded text-white hover:bg-green-700 focus:outline-none"
      >
        Connect Wallet
      </button>
    </div>
  );

  return (
    <div className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <img
                className="block lg:hidden h-8 w-auto"
                src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
                alt="Workflow"
              />
              <img
                className="hidden lg:block h-8 w-auto"
                src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
                alt="Workflow"
              />
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Team
                </a>
              </div>
            </div>
          </div>
          {walletConnectionBox}
        </div>
      </div>
    </div>
  );
};

export default Nav;
