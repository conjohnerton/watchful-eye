import React, { useState, useEffect, useCallback } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";

import Nav from "./components/Nav";

import "./App.css";

const App = () => {
  const [networkState, setNetworkState] = useState({
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
  });

  const connectToNetwork = useCallback(async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      const state = {
        ...networkState,
        web3,
        accounts,
        contract: instance,
      };
      setNetworkState(state);
      return state;
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
      return networkState;
    }
  });

  const runExample = async () => {
    let network = networkState;
    if (!networkState.contract || !networkState.accounts) {
      network = await connectToNetwork();
    }

    const { accounts, contract } = network;

    // Stores a given value, 5 by default.
    await contract.methods.set(1).send({ from: accounts[0] });
    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();
    // Update state with the result.
    setNetworkState({ ...networkState, storageValue: response });
  };

  useEffect(() => {
    connectToNetwork();
    // runExample();
  }, []);

  if (!networkState.web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <div className="App">
      <Nav isWalletConnected={networkState.accounts} />
      <h1>Good to Go!</h1>
      <p>Your Truffle Box is installed and ready.</p>
      <h2>Smart Contract Example</h2>
      <p>
        If your contracts compiled and migrated successfully, below will show a
        stored value of 5 (by default).
      </p>
      <p>
        Try changing the value stored on <strong>line 40</strong> of App.js.
      </p>
      <button
        onClick={runExample}
        className="bg-red-500 pl-5 pr-5 pt-1 pb-1 rounded text-white"
      >
        Click to change value
      </button>
      <div>The stored value is: {networkState.storageValue}</div>
    </div>
  );
};

export default App;
