import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, parseUnits } from "@ethersproject/units";
import { Contract as ethersContract } from "@ethersproject/contracts";
import "./App.css";
import { Row, Col, Button, Menu, Card, Input, Form, Image, Select, Divider } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import {
  useExchangePrice,
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useBalance,
  useExternalContractLoader,
} from "./hooks";
import { Header, Account, Ramp, Contract, GasGauge } from "./components";
import {
  INFURA_ID,
  ERC20_ABI,
  LENDING_POOL_ABI,
  LENDING_POOL_ADDRESS,
  AAVE_DATA_PROVIDER_ADDRESS,
  AAVE_DATA_PROVIDER_ABI,
} from "./constants";
import { useForm } from "antd/lib/form/Form";
import Transactor from "./helpers/Transactor";
import img from "./assets/index";
import formatUserData from "./helpers/BigNumberToString";

// 😬 Sorry for all the console logging 🤡
const DEBUG = false;

// 🔭 block explorer URL
const blockExplorer = "https://etherscan.io/"; // for xdai: "https://blockscout.com/poa/xdai/"

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
//const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
const mainnetProvider = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// const mainnetProvider = new JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/2x0LqJcsqPSf6zLESjiUOMjbbBmGRPZb");
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID)
// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = "http://" + window.location.hostname + ":8545"; // for xdai: https://dai.poa.network
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
// const localProvider = new JsonRpcProvider("https://kovan.infura.io/v3/" + INFURA_ID);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);

function App() {
  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 this hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(mainnetProvider); //1 for xdai

  /* 🔥 this hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice("fast"); //1000000000 for xdai

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  const tx = Transactor(userProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const userBalance = useBalance(userProvider, address);
  if (DEBUG) console.log("💵 yourUserBalance", userBalance ? formatEther(userBalance) : "...");

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  if (DEBUG) console.log("📝 readContracts", readContracts);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);
  if (DEBUG) console.log("🔐 writeContracts", writeContracts);

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

  const [approveForm] = useForm();
  async function addWatchfulEye() {
    const debtAsset = approveForm.getFieldValue("debtAsset");
    const collateralAsset = approveForm.getFieldValue("collateralAsset");
    const linkAmount = approveForm.getFieldValue("linkAmount");
    const daiAmount = approveForm.getFieldValue("daiAmount");
    const linkPrice = approveForm.getFieldValue("linkPrice");
    const daiPrice = approveForm.getFieldValue("daiPrice");

    console.log("Adding The Watchful Eye...");
    await tx(
      writeContracts["TheWatchfulEye"].addWatchfulEye(
        parseUnits(linkPrice, "wei"),
        parseUnits(daiPrice, "wei"),
        parseUnits(linkAmount),
        parseUnits(daiAmount),
        debtAsset.value,
        collateralAsset.value,
        aaveReserveData.find(pair => pair[0] === collateralAsset.label.slice(1)).tokenAddress,
      ),
    );

    setApproved(true);
  }

  async function approve() {
    const collateralAsset = approveForm.getFieldValue("collateralAsset");
    const linkAmount = approveForm.getFieldValue("linkAmount");

    console.log("Doing all approvals and setting up the contracts...");
    const link_rw = new ethersContract(collateralAsset.value, ERC20_ABI, userProvider.getSigner());
    await tx(link_rw.approve(readContracts["TheWatchfulEye"].address, parseUnits(linkAmount)));
    setApproved(false);
  }

  async function doLoan() {
    try {
      console.log("Checking the Eye's concern levels. 👁️");
      if (await writeContracts.TheWatchfulEye.isWatchfulEyeConcernedByWhatItSees()) {
        console.log("The Watchful Eye 👁️ is concerned... The Eye 👁️ will fix it.");
        tx(writeContracts.TheWatchfulEye.makeFlashLoan());
      }
    } catch (err) {
      console.error(err);
    }
  }

  const AaveDataProvider = useExternalContractLoader(userProvider, AAVE_DATA_PROVIDER_ADDRESS, AAVE_DATA_PROVIDER_ABI);
  const [aaveReserveData, setAaveReserveData] = useState();
  const [aTokens, setATokens] = useState();
  useEffect(() => {
    async function getData() {
      setAaveReserveData(await AaveDataProvider.getAllReservesTokens());
      setATokens(await AaveDataProvider.getAllATokens());
    }

    if (!AaveDataProvider) {
      return;
    }

    getData();
  }, [AaveDataProvider]);

  const LendingPool = useExternalContractLoader(localProvider, LENDING_POOL_ADDRESS, LENDING_POOL_ABI);
  const [userData, setUserData] = useState();
  useEffect(() => {
    async function getUserData() {
      const accountData = await LendingPool.getUserAccountData(address);
      setUserData(formatUserData(accountData));
    }

    LendingPool && getUserData();
  }, [LendingPool, address]);

  const ReserveTokenOptions = aaveReserveData?.map(pair => (
    <Select.Option key={pair[0]} value={pair[1]}>
      {pair[0]}
    </Select.Option>
  ));

  const ATokenOptions = aTokens?.map(pair => (
    <Select.Option key={pair[0]} value={pair[1]}>
      {pair[0]}
    </Select.Option>
  ));

  async function doBorrow() {
    const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const token = new ethersContract(LINK, ERC20_ABI, userProvider.getSigner());
    await token.approve(LENDING_POOL_ADDRESS, parseUnits("10"));

    const aave = new ethersContract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, userProvider.getSigner());
    await aave.deposit(LINK, parseUnits("10"), address, parseUnits("0"));
    await aave.borrow(
      DAI_ADDRESS,
      parseUnits("10"), // amount
      parseUnits("1", "wei"), // rate mode
      parseUnits("0", "wei"), // referral
      address,
    );

    async function getUserData() {
      const accountData = await LendingPool?.getUserAccountData(address);
      setUserData(formatUserData(accountData));
    }
    
    if (LendingPool) {
      await getUserData();
    }
  }

  // async function getUserData() {
  //   const accountData = await LendingPool.getUserAccountData(address);
  //   setUserData(formatUserData(accountData));
  // }

  const [approved, setApproved] = useState(false);

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
              Home
            </Link>
          </Menu.Item>
          <Menu.Item key="/dash">
            <Link
              onClick={() => {
                setRoute("/dash");
              }}
              to="/dash"
            >
              Dashboard
            </Link>
          </Menu.Item>
          <Menu.Item key="/adminDash">
            <Link
              onClick={() => {
                setRoute("/adminDash");
              }}
              to="/adminDash"
            >
              Admin Dashboard
            </Link>
          </Menu.Item>
        </Menu>

        <Switch>
          <Route exact path="/">
            <div className="flex column">
              <h2 style={{ marginLeft: 30, paddingTop: 80, marginBottom: -120 }}>The Eye is Watching...</h2>
              <Image src={img} height="50%" width="50%" />
            </div>
          </Route>
          <Route exact path="/dash">
            <>
              <Card>
                {userData && (
                  <div>
                    <p>Loan Health Factor: {userData.healthFactor}</p>
                    <p>Total Debt (Eth): {userData.totalDebtETH}</p>
                    <p>Total Collateral (Eth): {userData.totalCollateralETH}</p>
                  </div>
                )}
              </Card>
              <div style={{ margin: "auto", width: "70vw" }}>
                <Card
                  title="Begin The Watchful Eye's ritual."
                  size="large"
                  style={{ marginTop: 25, width: "100%", flex: true, alignItems: "center" }}
                >
                  <Form form={approveForm}>
                    <Form.Item label="Debt Asset" name="debtAsset">
                      <Select labelInValue style={{ marginLeft: 27, width: 120 }}>
                        {ReserveTokenOptions}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Collateral Asset" name="collateralAsset">
                      <Select labelInValue style={{ width: 120 }}>
                        {ATokenOptions}
                      </Select>
                    </Form.Item>
                    <Divider />
                    <Form.Item
                      label="Amount of debt"
                      name="daiAmount"
                      rules={[{ required: true, message: "Please input a number!" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label="Amount of collateral"
                      name="linkAmount"
                      rules={[{ required: true, message: "Please input a number!" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Divider />
                    <Form.Item
                      label="Debt price limit"
                      name="daiPrice"
                      rules={[{ required: true, message: "Please input a number!" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label="Collateral price limit"
                      name="linkPrice"
                      rules={[{ required: true, message: "Please input a number!" }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item>
                      <Button disabled={approved !== false} onClick={addWatchfulEye} type="primary" htmlType="submit">
                        Configure the Eye with your information
                      </Button>
                    </Form.Item>
                    <Form.Item>
                      <Button disabled={approved !== true} onClick={approve} type="primary" htmlType="submit">
                        Approve of the Eye's Intervention
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>

              {/* Make flashloan */}
              <div style={{ margin: "auto", width: "70vw" }}>
                <Card
                  title="Liquidate the position in The Watchful Eye's gaze."
                  size="large"
                  style={{ marginTop: 25, width: "100%" }}
                >
                  <Button onClick={doLoan} type="primary">
                    Use The Eye's Blessing
                  </Button>
                </Card>
              </div>
            </>
          </Route>
          <Route path="/adminDash">
            <Card>
              <Button onClick={doBorrow}>Do Loan Setup</Button>
            </Card>
            <Contract
              name="TheWatchfulEye"
              signer={userProvider.getSigner()}
              provider={userProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[0, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} />
          </Col>

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
