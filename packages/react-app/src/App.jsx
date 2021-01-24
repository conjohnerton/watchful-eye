import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { Web3Provider } from "@ethersproject/providers";
import { Contract as ethersContract } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units'
import "./App.css";
import { Row, Col, Menu, Button, Form, Input, Card } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import {
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useContractReader,
  // useEventListener,
  useExternalContractLoader,
} from "./hooks";
import { Header, Account, Contract, GasGauge } from "./components";
import AccountDetailsFromBigNumbers from "./helpers/BigNumberToString";
//import Hints from "./Hints";
// import { Hints, ExampleUI, Subgraph } from "./views";
import UserInfo from "./components/UserInfo";
import {
  ERC20_ABI,
  INFURA_ID,
  LENDING_POOL_ABI,
  LENDING_POOL_ADDRESS_PROVIDER_ABI,
  LENDING_POOL_ADDRESS_PROVIDER_ADDRESS,
  LINK_ADDRESS,
} from "./constants";
import { useForm } from "antd/lib/form/Form";

// 😬 Sorry for all the console logging 🤡
const DEBUG = false;

// 🔭 block explorer URL
const blockExplorer = "https://etherscan.io/"; // for xdai: "https://blockscout.com/poa/xdai/"

// 🛰 providers
// if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
//const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet", INFURA_ID);

// 🏠 Your local provider is usually pointed at your local blockchain
// const localProviderUrl = "http://" + window.location.hostname + ":8545"; // for xdai: https://dai.poa.network
// // as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
// const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
// if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
// const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);
const localProvider = undefined;

function App() {
  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 this hook will get the price of ETH from 🦄 Uniswap: */
  // const price = useExchangePrice(mainnetProvider); // 1 for xdai

  /* 🔥 this hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice("fast"); // 1000000000 for xdai

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // The transactor wraps transactions and provides notificiations

  // Faucet Tx can be used to send funds from the faucet

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  // const yourLocalBalance = useBalance(localProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(injectedProvider);
  if (DEBUG) console.log("📝 readContracts", readContracts);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);
  if (DEBUG) console.log("🔐 writeContracts", writeContracts);

  // Gets Aave lending pool and user account info
  const LendingPoolAddressesProvider = useExternalContractLoader(
    injectedProvider,
    LENDING_POOL_ADDRESS_PROVIDER_ADDRESS,
    LENDING_POOL_ADDRESS_PROVIDER_ABI,
  );
  const LendingPoolAddress = useContractReader(
    { LendingPoolAddressesProvider },
    "LendingPoolAddressesProvider",
    "getLendingPool",
    [],
  );
  const LendingPool = useExternalContractLoader(injectedProvider, LendingPoolAddress, LENDING_POOL_ABI);
  const aaveAccountDataReader = useContractReader({ LendingPool }, "LendingPool", "getUserAccountData", [address]);
  const [accountData, setAccountData] = useState(null);
  useEffect(() => {
    if (aaveAccountDataReader) {
      setAccountData(AccountDetailsFromBigNumbers(aaveAccountDataReader));
    }
  }, [aaveAccountDataReader]);

  // Listen to events from FlashLoanReceiver
  // const BorrowMadeEvents = useEventListener(readContracts, "FlashLoanReceiver", "borrowMade", injectedProvider, 1);
  // const FlashLoanStartedEvents = useEventListener(
  //   readContracts,
  //   "FlashLoanReceiver",
  //   "FlashLoanStarted",
  //   injectedProvider,
  //   1,
  // );
  // const FlashLoanEndedEvents = useEventListener(
  //   readContracts,
  //   "FlashLoanReceiver",
  //   "FlashLoanEnded",
  //   injectedProvider,
  //   1,
  // );
  // useEffect(() => {
  //   console.log("FlashLoanStartedEvents", FlashLoanStartedEvents);
  //   console.log("BorrowMadeEvents", BorrowMadeEvents);
  //   console.log("FlashLoanEndedEvents", FlashLoanEndedEvents);
  // }, [FlashLoanEndedEvents, BorrowMadeEvents, FlashLoanStartedEvents]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const signer = userProvider?.getSigner();

  const [collateralApprovalForm] = useForm();
  async function onFinish() {
    const erc20_rw = new ethersContract(LINK_ADDRESS, ERC20_ABI, signer);
    await erc20_rw.approve(readContracts["TheWatchfulEye"].address, parseUnits(collateralApprovalForm.getFieldValue("amount")));
  }

  async function doLoan() {
    await writeContracts["TheWatchfulEye"].makeFlashLoan();
  }

  const contracts = signer && (
    <>
      {/* Approve collateral interaction */}
      <div style={{ margin: "auto", width: "70vw" }}>
        <Card
          title="Approve The Watchful Eye's interactions with your funds"
          size="large"
          style={{ marginTop: 25, width: "100%" }}
        >
          <Form form={collateralApprovalForm} onFinish={onFinish}>
            {/* <Form.Item label="Collateral Amount" /> */}
            <Form.Item
              label="Collateral Amount"
              name="amount"
              rules={[{ required: true, message: 'Please input a number!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Approve!</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      
      {/* Make flashloan */}
      <div style={{ margin: "auto", width: "70vw" }}>
        <Card
          title="Do the loan"
          size="large"
          style={{ marginTop: 25, width: "100%" }}
        >
          <Form onFinish={doLoan}>
            <Form.Item>
              <Button type="primary" htmlType="submit">Send!</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      {/* <Contract
        name="TheWatchfulEye"
        signer={signer}
        provider={injectedProvider}
        address={address}
        blockExplorer={blockExplorer}
      /> */}
      {/* <Contract 
        name="Link. Use This To Approve "
      /> */}
      {/* <Contract
        name="Fake"
        signer={signer}
        provider={injectedProvider}
        address={address}
        blockExplorer={blockExplorer}
      /> */}
    </>
  );

  return (
    <div className="App">
      <Header />
      <BrowserRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Contracts
            </Link>
          </Menu.Item>
          <Menu.Item key="/userInfo">
            <Link
              onClick={() => {
                setRoute("/userInfo");
              }}
              to="/userInfo"
            >
              User Info
            </Link>
          </Menu.Item>
          {/*
          <Menu.Item key="/exampleui">
            <Link
              onClick={() => {
                setRoute("/exampleui");
              }}
              to="/exampleui"
            >
              ExampleUI
            </Link>
          </Menu.Item>
          <Menu.Item key="/subgraph">
            <Link
              onClick={() => {
                setRoute("/subgraph");
              }}
              to="/subgraph"
            >
              Subgraph
            </Link>
          </Menu.Item> */}
        </Menu>

        <Switch>
          <Route exact path="/">
            {contracts}
          </Route>
          <Route path="/userInfo">
            <UserInfo
              availableBorrowsETH={accountData?.availableBorrowsETH}
              currentLiquidationThreshold={accountData?.currentLiquidationThreshold}
              healthFactor={accountData?.healthFactor}
              ltv={accountData?.ltv}
              totalCollateralETH={accountData?.totalCollateralETH}
              totalDebtETH={accountData?.totalDebtETH}
            />
          </Route>
          {/*
          <Route path="/subgraph">
            <Subgraph
              subgraphUri={props.subgraphUri}
              tx={tx}
              writeContracts={writeContracts}
              mainnetProvider={mainnetProvider}
            />
          </Route> */}
        </Switch>
      </BrowserRouter>
      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          // mainnetProvider={mainnetProvider}
          // price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
      </div>
      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[0, 4]}>
          {/* <Col span={8}>
            <Ramp price={price} address={address} />
          </Col> */}

          <Col span={3} offset={6} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
        </Row>
      </div>
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "kovan", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

export default App;
