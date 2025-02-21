"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Wallet,
  Copy,
  ExternalLink,
  ArrowRight,
  Share2,
  CheckCircle,
} from "lucide-react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletClient, useAccount, useBalance } from "wagmi";
import { parseEther } from "viem";
import axios from "axios";
import { useParams } from "next/navigation";
import { ethers } from "ethers";

const SolanaSwapUI: React.FC = () => {
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false); // new signing state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<string>("");
  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [signatureLink, setSignatureLink] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<{
    [key: string]: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [showAdditionalUI, setShowAdditionalUI] = useState<boolean>(false);
  const [bnbAmount, setBnbAmount] = useState<string>("");
  const [points, setPoints] = useState<number | null>(null);
  const [quoteData, setQuoteData] = useState<any | null>(null);
  const [weiAmount, setWeiAmount] = useState<string>("");
  const [success, setSuccess] = useState<boolean | null>(false);
  const [txnHash, setTxnHash] = useState<string>("");

  const [bnbBal, setBnbBal] = useState<string>("");
  const [memeBal, setMemeBal] = useState<string>("");
  const [currentPoints, setCurrentPoints] = useState<any | null>(null);

  const handleBnbAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newBnbAmount = event.target.value;
    setBnbAmount(newBnbAmount);

    try {
      // Convert BNB to Wei using ethers.js
      const wei = ethers.utils.parseEther(newBnbAmount);
      setWeiAmount(wei.toString());
    } catch (error: any) {
      console.error("Error converting to Wei:", error.message);
      setWeiAmount(""); // Clear weiAmount on error
    }
  };

  const { isConnected, address } = useAccount();
  useEffect(() => {
    if (isConnected && address) {
      registerWallet(address);
    }
  }, [isConnected, address]);

  const registerWallet = async (walletAddress: string) => {
    try {
      const response = await fetch("https://bnbswapapi.vercel.app/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await response.json();
      console.log("Wallet registered:", data);
      setPoints(data.points);
    } catch (error) {
      console.error("Error registering wallet:", error);
    }
  };

  const params = useParams();
  const destAddress = params.address;
  console.log("destAddress", destAddress);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAmount(value);
  };

  const result = useBalance({
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  });

  const swapParams = {
    src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Token address of 1INCH
    dst: destAddress, // Token address of DAI
    amount: weiAmount,
    from: address,
    slippage: 1, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false, // Set to true to allow partial filling of the swap order
  };

  const chainId = 56;

  const broadcastApiUrl =
    "https://api.1inch.dev/tx-gateway/v1.1/" + chainId + "/broadcast";
  const apiBaseUrl = "https://api.1inch.dev/swap/v6.0/" + chainId;

  // Construct full API request URL
  function apiRequestUrl(methodName: any, queryParams: any) {
    return (
      apiBaseUrl +
      methodName +
      "?" +
      new URLSearchParams(queryParams).toString()
    );
  }

  // Post raw transaction to the API and return transaction hash
  async function broadCastRawTransaction(rawTransaction: any) {
    return fetch(broadcastApiUrl, {
      method: "post",
      body: JSON.stringify({ rawTransaction }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer uzF2lXeO9pYtpjthDs0ltrkVwDcup6bd",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        return res.transactionHash;
      });
  }

  const { data: walletClient } = useWalletClient();

  async function signAndSendTransaction(transaction: any) {
    try {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      // Prepare the transaction
      const tx = {
        to: transaction.to as `0x${string}`,
        value: transaction.value.toString(),
        data: (transaction.data || "0x") as `0x${string}`,
      };

      const hash = await walletClient.sendTransaction(tx);
      return hash;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }

  // If you need to wait for transaction confirmation, you can use this helper
  async function waitForTransaction(hash: string) {
    const { createPublicClient, http } = await import("viem");
    const { bsc } = await import("viem/chains");

    const client = createPublicClient({
      chain: bsc,
      transport: http(),
    });

    const { waitForTransactionReceipt } = await import("viem/actions");
    const receipt = await waitForTransactionReceipt(client, {
      hash: hash as `0x${string}`,
    });
    return receipt;
  }

  const handleSwap = async () => {
    const swapTransaction = await buildTxForSwap(swapParams);

    console.log("Transaction for swap: ", swapTransaction);

    const res = await signAndSendTransaction(swapTransaction);
    console.log("Transaction hash: ", res);

    const receipt = await waitForTransaction(res);
    console.log("Transaction receipt: ", receipt);

    setSuccess(true);
    setTxnHash(receipt.transactionHash);
    if (address) {
      await updatePoints(address);
    }
  };

  async function buildTxForSwap(swapParams: any) {
    const url = apiRequestUrl("/swap", swapParams);

    try {
      const response = await axios.post("/api/swap-proxy", {
        url: url,
      });

      return response.data.tx;
    } catch (error) {
      console.error("Error in buildTxForSwap:", error);
      throw error;
    }
  }

  const updatePoints = async (walletAddress: string) => {
    try {
      const response = await fetch(
        "https://bnbswapapi.vercel.app/api/points/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: walletAddress }),
        }
      );
      const data = await response.json();
      console.log("Points updated:", data);
      if (address) {
        await getPoints(address);
      }
    } catch (error) {
      console.error("Error updating points:", error);
    }
  };

  // To display points
  const getPoints = async (walletAddress: string) => {
    try {
      const response = await fetch(
        `https://bnbswapapi.vercel.app/api/points/${walletAddress}`
      );
      const data = await response.json();
      console.log("Current points:", data.points);
      setCurrentPoints(data.points);
      return data.points;
    } catch (error) {
      console.error("Error fetching points:", error);
    }
  };

  const { data: bnbBalance } = useBalance({
    address: address, // user's wallet address
  });

  const { data: tokenBalance } = useBalance({
    address: address,
    token: destAddress as `0x${string}`, // destination token address
  });

  useEffect(() => {
    if (bnbBalance) {
      setBnbBal(bnbBalance?.formatted);
    }
    if (tokenBalance) {
      setMemeBal(tokenBalance?.formatted);
    }
  }, [bnbBalance, tokenBalance]);

  console.log("balance", bnbBalance, tokenBalance);

  const srcAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const dstAddress = destAddress;
  const fetchData = async () => {
    setIsLoading(true);
    const weiAmountNumber = Number(weiAmount);
    if (weiAmountNumber <= 0) {
      return;
    }
    try {
      console.log(weiAmount);
      const response = await axios.post("/api/quote-proxy", {
        src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        dst: destAddress,
        amount: weiAmount,
      });

      if (response.status === 200) {
        // Convert wei to ETH before setting the quote data
        const ethAmount = ethers.utils.formatEther(response.data.dstAmount);
        console.log("ethAmount", ethAmount);
        setQuoteData(ethAmount);
      }
      console.log(response.data);
    } catch (error) {
      console.error(error);
      setQuoteData({ error: "Failed to fetch quote" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bnbAmount && destAddress) {
      fetchData();
    }
  }, [bnbAmount, destAddress]);

  useEffect(() => {
    if (!destAddress) return;

    const fetchData = async () => {
      console.log("destAddress", destAddress);
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/1inch-proxy?address=${destAddress}`
        );
        setApiResponse(response.data);

        console.log("API Response:", response.data);
      } catch (error) {
        console.error("API Error:", error);
        setApiResponse({ error: "Failed to fetch token data" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // if (showAdditionalUI) {
    //   fetchData();
    // }
  }, [destAddress]);

  const ResData = apiResponse;
  console.log("====================================");
  console.log(ResData);
  console.log("====================================");

  const handleContinue = () => {
    setShowAdditionalUI(true);
  };

  const handleShare = () => {
    const tweetText = `Just bought my favorite memecoin on winks.fun! Join me and earn points! 🚀\n\nhttps://buymemes.winks.fun/wink/${destAddress}`;
    window.open(
      `https://twitter.com/intent/post?text=${encodeURIComponent(tweetText)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const getCurrentUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  useEffect(() => {
    console.log("Current URL:", getCurrentUrl());
  }, []);

  const isAmountGreaterThanBalance =
    bnbBalance && bnbAmount
      ? Number(bnbAmount) > Number(bnbBalance?.formatted)
      : false;

  useEffect(() => {
    setTimeout(() => {
      setIsPageLoading(false);
    }, 2000);
  }, []);

  return (
    <>
      {isPageLoading ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-800 font-medium animate-pulse">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-pink-100 to-yellow-100 text-gray-800 flex items-center justify-center p-4 font-mono relative overflow-hidden">
          {/* Animated background patterns */}
          {/* <div className="absolute inset-0 bg-white">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-300/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl animate-pulse" />
            <div className="absolute top-1/4 right-0 w-72 h-72 bg-pink-300/20 rounded-full translate-x-1/2 blur-2xl animate-pulse delay-75" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-yellow-300/20 rounded-full translate-y-1/2 blur-2xl animate-pulse delay-150" />
          </div> */}

          <div className="relative w-full max-w-md">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-pink-100 to-yellow-300 rounded-2xl blur opacity-70" />
            {/* Main card */}
            <div className="relative bg-white shadow-2xl rounded-2xl p-3 space-y-4 border border-white">
              {/* Connect Button */}
              <div className="flex justify-between items-center">
                {!showAdditionalUI && (
                  <div className="flex items-baseline bg-gray-100/50 border border-gray-500/10 p-2 px-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-black font-medium">
                        Your Points:
                      </span>
                    </div>
                    <span className=" font-bold text-purple-600">
                      {points || 0}
                    </span>
                  </div>
                )}
                <div className=" flex justify-end ml-auto">
                  <ConnectButton />
                </div>
              </div>
              {/* {!showAdditionalUI && (
                <div className="">
                  <p>Buy DOGE tokens with BNB in one-click</p>
                </div>
              )} */}
              {!showAdditionalUI && (
                <div className="max-w-md mx-auto">
                  <div className="rounded-3xl overflow-hidden p-0.5 ">
                    <div className="bg-white rounded-[22px] border border-gray-500/50 p-3 px-4">
                      {/* Header with Large Token Display */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full blur-lg opacity-50"></div>
                          <img
                            src={
                              apiResponse?.logoURI !== null &&
                              apiResponse?.logoURI !== undefined
                                ? apiResponse?.logoURI
                                : "https://res.cloudinary.com/dvddnptpi/image/upload/v1739379832/frfgvnra42g6x7ovmana.webp"
                            }
                            alt="Token Logo"
                            className="relative w-16 h-16 rounded-full border-4 border-white shadow-xl"
                          />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1 mt-2">
                          {apiResponse?.name || "Loading..."}{" "}
                          <span className="text-sm text-gray-500 font-semibold">
                            ({apiResponse?.symbol || "MEME"})
                          </span>
                        </h2>
                        <p className="text-sm text-gray-500 font-semibold"></p>
                      </div>

                      {/* Price Impact Banner */}
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-2 px-4">
                        <p className="text-sm text-center text-gray-700 font-medium">
                          Buy{" "}
                          <span className=" font-semibold">
                            {apiResponse?.symbol || "meme"}
                          </span>{" "}
                          tokens with BNB in one click and earn points!
                        </p>
                      </div>

                      {/* Points Display as a Highlight */}
                      {/* <div className=" mt-2 bg-gray-50 rounded-xl p-2 px-4 border border-gray-100 flex justify-between items-center"> */}

                      <button
                        onClick={handleContinue}
                        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-3 px-6 font-bold text-base 
                                flex items-center justify-center gap-2 
                                hover:opacity-90 transition-all duration-200
                                hover:scale-95
                                disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Buy
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      {/* </div> */}

                      {/* Action Button */}

                      {/* Footer */}
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-500">
                          Powered by winks.fun
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showAdditionalUI && (
                <>
                  {errorMessage && (
                    <div className="flex items-center text-sm justify-center gap-2 p-3 mb-4 text-red-600 bg-red-50/60 backdrop-blur-sm rounded-lg border-l-4 border-red-500 animate-slideIn">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Input Card */}
                    <div className="bg-white/40 border border-gray-400/50 backdrop-blur-md rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src="https://res.cloudinary.com/dvddnptpi/image/upload/v1739379832/frfgvnra42g6x7ovmana.webp"
                            alt="BNB"
                            className="w-8 h-8 rounded-full ring-2 ring-yellow-400/50"
                          />
                          <span className="font-medium text-gray-700">BNB</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Balance: ${bnbBal}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.0"
                          value={bnbAmount}
                          onChange={handleBnbAmountChange}
                          className="w-full text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-gray-700 placeholder-gray-300"
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {/* <button className="text-sm text-blue-500 hover:text-blue-600">
                            MAX
                          </button> */}
                          <span className="text-sm text-gray-400">BNB</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-white/60 rounded-full shadow-sm">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Output Card */}
                    {apiResponse && (
                      <div className="bg-white/40 border border-gray-400/50 backdrop-blur-md rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                apiResponse?.logoURI ||
                                "https://res.cloudinary.com/dvddnptpi/image/upload/v1739379832/frfgvnra42g6x7ovmana.webp"
                              }
                              alt={apiResponse.symbol}
                              className="w-8 h-8 rounded-full ring-2 ring-purple-400/50"
                            />
                            <span className="font-medium text-gray-700">
                              {apiResponse.symbol}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Balance: ${memeBal}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="text-xl font-medium text-gray-700">
                            {quoteData
                              ? Number(quoteData).toLocaleString("en-US", {
                                  maximumFractionDigits: 6,
                                })
                              : "0.00"}
                          </div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <span className="text-sm text-gray-400">
                              {apiResponse.symbol}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Swap Button */}
                    <button
                      onClick={handleSwap}
                      disabled={
                        !bnbAmount ||
                        Number(bnbAmount) <= 0 ||
                        !isConnected ||
                        isAmountGreaterThanBalance
                      }
                      className={`w-full mt-2 py-4 px-6 rounded-xl font-medium text-white
              bg-gradient-to-r from-blue-500 to-purple-500
              ${
                !bnbAmount ||
                Number(bnbAmount) <= 0 ||
                !isConnected ||
                isAmountGreaterThanBalance
                  ? "disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                  : "hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              }
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <span>
                          {!isConnected
                            ? "Connect Wallet"
                            : !bnbAmount
                            ? "Enter Amount"
                            : isAmountGreaterThanBalance
                            ? "Insufficient Funds"
                            : "Buy"}
                        </span>
                      )}
                    </button>

                    {/* Price Impact & Route Info (Optional) */}
                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Price Impact</span>
                        <span className="text-gray-700">~0.05%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Route</span>
                        <span className="text-gray-700">
                          BNB → {apiResponse?.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {success && (
                <div className="absolute inset-0 bg-white backdrop-blur-lg flex items-center justify-center z-50 font-mono">
                  <div className="relative w-full max-w-md mx-4">
                    {/* Background glow effects */}
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-300/30 rounded-full blur-xl" />
                    <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-pink-300/30 rounded-full blur-xl" />

                    {/* Main content card */}
                    <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        {/* Success animation */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-md animate-pulse" />
                          <div className="relative animate-bounce">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                          </div>
                        </div>

                        {/* Success message */}
                        <div className="space-y-3 text-center">
                          <h2 className="text-2xl font-bold text-black">
                            Transaction Successful!
                          </h2>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-3 border border-blue-100/50">
                            <p className="text-gray-700 font-semibold text-lg mb-3">
                              You earned 10 points!
                            </p>
                            <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                              <span>Current Points:</span>
                              <span className="font-bold text-purple-600 text-lg">
                                {currentPoints}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Transaction link */}
                        <a
                          href={`https://bscscan.com/tx/${txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View on BSCscan</span>
                        </a>

                        {/* Share button */}
                        <button
                          onClick={handleShare}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold
                                 bg-gradient-to-r from-blue-500 to-purple-500 text-white
                                 hover:opacity-90 active:scale-[0.98] transition-all duration-200
                                 shadow-lg hover:shadow-xl"
                        >
                          <Share2 className="w-5 h-5" />
                          Refer your friends
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SolanaSwapUI;
