import React, { useState } from "react";
import web3 from "web3";
import LendingPoolContract from "./contracts/LendingPool.json";
import LendingPoolAddressesProviderContract from "./contracts/LendingPoolAddressesProvider.json";
import getWeb3 from "./getWeb3";

import Nav from "./components/Nav";
import Meter from "./components/Meter";

import "./App.css";

const App = () => {
  const [networkState, setNetworkState] = useState({
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
  });

  const [healthFactor, setHealthFactor] = useState(-1);

  const connectToNetwork = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      // const networkId = await web3.eth.net.getId();
      // const deployedNetwork = LendingPoolContract.networks[networkId];

      // 0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408 on aave flashloan repo
      // 0x88757f2f99175387ab4c6a4b3067c77a695b0349 on aave contracts page
      const LendingPoolAddressesProviderInstance = new web3.eth.Contract(
        LendingPoolAddressesProviderContract.abi,
        "0x88757f2f99175387ab4c6a4b3067c77a695b0349"
      );
      const lendingPool = await LendingPoolAddressesProviderInstance.methods
        .getLendingPool()
        .call();

      console.log(lendingPool);

      const LendingPoolInstance = new web3.eth.Contract(
        LendingPoolContract.abi,
        lendingPool
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      const state = {
        ...networkState,
        web3,
        accounts,
        contract: LendingPoolInstance,
      };
      setNetworkState(state);
      return state;
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check metamask or your console for details.`
      );
      console.error(error);
      return networkState;
    }
  };

  const runExample = async () => {
    let network = networkState;
    if (!networkState.contract || !networkState.accounts) {
      network = await connectToNetwork();
    }

    const { accounts, contract } = network;
    // await contract.methods.

    const userData = await contract.methods
      .getUserAccountData(accounts[0])
      .call();
    setHealthFactor(
      parseFloat(web3.utils.fromWei(userData.healthFactor)).toFixed(3)
    );
    console.log(await contract.methods.getUserAccountData(accounts[0]).call());
    console.log(
      await contract.methods
        .getReserveData("0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD")
        .call()
    );
    // Stores a given value, 5 by default.
    // await contract.methods.set(1).send({ from: accounts[0] });
  };

  if (!networkState.web3) {
    return (
      <div>
        <Nav isWalletConnected={false} connectToNetwork={connectToNetwork} />
        <div>Loading Web3, accounts, and contract...</div>
      </div>
    );
  }

  const healthFactorMeter =
    healthFactor > 10 ? (
      <p>
        Woah there, you've got a <strong>huge</strong> health factor. Do you
        have a loan with AAVE yet?
      </p>
    ) : (
      healthFactor > -1 && (
        <Meter max={5} min={0} value={healthFactor} unit={"HF"} />
      )
    );

  return (
    <div className="App">
      <Nav
        isWalletConnected={networkState.accounts}
        walletAddress={networkState.accounts[0]}
        connectToNetwork={connectToNetwork}
      />
      <div className="flex flex-col items-center space-y-3">
        <h1>Good to Go!</h1>
        <p>Your Truffle Box is installed and ready.</p>
        <h2>Smart Contract Example</h2>
        <p>
          If your contracts compiled and migrated successfully, below will show
          a stored value of 5 (by default).
        </p>
        <p>
          Try changing the value stored on <strong>line 40</strong> of App.js.
        </p>
        {healthFactorMeter}
        <button
          onClick={runExample}
          className="bg-blue-500 pl-5 pr-5 pt-1 pb-1 rounded text-white"
        >
          Click to get AAVE health factor!
        </button>
        <div>Your health factor is: {healthFactor}</div>
      </div>
    </div>
  );
};

export default App;
