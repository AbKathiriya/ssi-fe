import { useState } from "react";
import { ethers } from "ethers";
import SwissShares from "./abi/SwissShares.json";
import "./App.css";

function App() {
  const contractAddress = "0xd0d749De324CC856d59b94D415B8bd18325Cc89b";
  let privateKey = process.env["REACT_APP_ADMIN_PRIVATE_KEY"];
  const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = ethProvider.getSigner();
  let admin = new ethers.Wallet(privateKey, ethProvider);
  const SwissSharesContract = new ethers.Contract(
    contractAddress,
    SwissShares,
    signer
  );

  const [userAddress, setUserAddress] = useState("");
  const [balanceAddress, setBalanceAddress] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(0);

  const requestAccount = async () => {
    try {
      await ethProvider.send("eth_requestAccounts", []);
      const signer = ethProvider.getSigner(); // Your current metamask account;
      setUserAddress(await signer.getAddress());
      console.log("Account:", await signer.getAddress());
    } catch (error) {
      console.error(error);
      alert("Login to Metamask first");
    }
  };

  const getBalance = async () => {
    try {
      let bal = (
        await SwissSharesContract.balanceOf(balanceAddress)
      ).toNumber();
      setBalance(bal);
    } catch (err) {
      alert(err);
    }
  };
  const addToWhitelist = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(); // Your current metamask account;
      const contract = new ethers.Contract(
        contractAddress,
        SwissShares,
        signer
      );
      let tx = await contract.addWalletToWhitelist(whitelistAddress);
      console.log(tx.hash);
      await tx.wait();
      console.log(contract.isWalletWhitelisted(whitelistAddress));
      alert("Success");
    } catch (err) {
      alert(err);
    }
  };
  const transfer = async () => {
    let validAfter = 0;
    let validBefore = Math.floor(Date.now() / 1000) + 3600; // Valid for an hour
    let nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const { chainId } = await ethProvider.getNetwork();
    console.log(chainId);
    const walletAddress = await signer.getAddress();
    const domain = {
      name: "SwissShares",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
    };
    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const message = {
      from: walletAddress,
      to: transferAddress,
      value: 1000,
      validAfter,
      validBefore,
      nonce,
    };
    try {
      const signature = await signer._signTypedData(domain, types, message);
      let verifiedAddress = ethers.utils.verifyTypedData(
        domain,
        types,
        message,
        signature
      );
      console.log(
        `Signed by: ${verifiedAddress}\r\nExpected : ${walletAddress}`
      );

      const expandedSign = ethers.utils.splitSignature(signature);
      await SwissSharesContract.connect(admin).transferWithAuthorization(
        walletAddress,
        transferAddress,
        1000,
        validAfter,
        validBefore,
        nonce,
        expandedSign.v,
        expandedSign.r,
        expandedSign.s
      );
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="App">
      <div className="connect-wallet">
        <div className="user-address">{userAddress}</div>
        <button onClick={() => requestAccount()}>Connect Wallet</button>
      </div>
      <div className="operations">
        <div className="get-balance">
          <input
            type="text"
            value={balanceAddress}
            onChange={(e) => {
              setBalanceAddress(e.target.value);
            }}
          />
          <button
            onClick={() => {
              getBalance();
            }}
          >
            Get Balance
          </button>
          <div>{balance}</div>
        </div>
        <div className="whitelist">
          <input
            type="text"
            value={whitelistAddress}
            onChange={(e) => {
              setWhitelistAddress(e.target.value);
            }}
          />
          <button
            onClick={() => {
              addToWhitelist();
            }}
          >
            Whitelist Me!
          </button>
        </div>
        <div className="token-transfer">
          <input
            type="text"
            value={transferAddress}
            onChange={(e) => {
              setTransferAddress(e.target.value);
            }}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
            }}
          />
          <button
            onClick={() => {
              transfer();
            }}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
