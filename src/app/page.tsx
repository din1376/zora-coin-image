'use client';
import React, { useState } from "react";
import Image from "next/image";
import { useAccount, useConnect, useChainId, useSwitchChain } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { setApiKey, createMetadataBuilder, createZoraUploaderForCreator, createCoin, DeployCurrency } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { createPublicClient, http } from "viem";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});
import { useWalletClient } from "wagmi";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Coin It modal state
  const [showModal, setShowModal] = useState(false);
  const [coinName, setCoinName] = useState("");
  const [coinSymbol, setCoinSymbol] = useState("");
  const [coinDesc, setCoinDesc] = useState("");


  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setImage(null);
    try {
      const res = await fetch("/api/gemini-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate image");
      const data = await res.json();
      setImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = "zora-mini-image.png";
    link.click();
  };

  // MetaMask wallet connect logic
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const BASE_MAINNET_ID = 8453;
  const handleConnect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Find the MetaMask connector by name (since metaMask() does not have an 'id' property)
    const metaMaskConnector = connectors.find(c => c.name === "MetaMask");
    if (metaMaskConnector) connect({ connector: metaMaskConnector });
  };
  const handleSwitchToBase = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    switchChain({ chainId: BASE_MAINNET_ID });
  };

  // Minting status state
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [mintedCoin, setMintedCoin] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  // Set your Zora API key here or via env var (see .env.local)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY || "");
    }
  }, []);

  async function handleMintCoin() {
    setMintStatus("Uploading image and metadata...");
    setMintedCoin(null);
    try {
      if (!image) throw new Error("No image to mint");
      if (!address) throw new Error("Wallet not connected");
      if (!walletClient) {
        setMintStatus("Error: Wallet client not ready. Please reconnect MetaMask and reload the page.");
        return;
      }

      // Convert base64 image to File
      const res = await fetch(image);
      const blob = await res.blob();
      const file = new File([blob], "coin-image.png", { type: blob.type });

      // Upload metadata to Zora
      const builder = createMetadataBuilder()
        .withName(coinName)
        .withSymbol(coinSymbol)
        .withDescription(coinDesc)
        .withImage(file);
      const { createMetadataParameters } = await builder.upload(
        createZoraUploaderForCreator(address)
      );

      setMintStatus("Creating coin onchain...");
      // Prepare coin params
      const coinParams = {
        ...createMetadataParameters,
        payoutRecipient: address,
        currency: DeployCurrency.ZORA,
        chainId: base.id,
      };

      // Mint coin
      const result = await createCoin(
        coinParams,
        walletClient,
        publicClient,
        { gasMultiplier: 120 }
      );
      setMintStatus("Coin minted!");
      setMintedCoin(result.address);
    } catch (err: any) {
      setMintStatus("Error: " + (err.message || err.toString()));
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 bg-gradient-to-br from-black via-zinc-900 to-zinc-800" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-xl p-10 flex flex-col gap-8 bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)' }}>
        <h1 className="text-2xl font-bold text-center mb-2 text-zinc-100 tracking-tight">Zora Mini</h1>
        <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleGenerate(); }}>
          <label htmlFor="prompt" className="font-medium text-zinc-300">Enter a prompt to generate an image:</label>
          <input
            id="prompt"
            name="prompt"
            type="text"
            placeholder="A cat in space, digital art..."
            className="rounded-xl border-none px-4 py-3 text-zinc-100 bg-white/10 focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder:text-zinc-500 backdrop-blur-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
            value={prompt}
            onChange={handlePromptChange}
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg px-7 py-3 mt-2 transition-all duration-150 shadow-sm focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Generating..." : "Generate Image"}
          </button>
        </form>
        <div className="flex flex-col items-center gap-2">
          {error && (
            <div className="text-red-400 text-sm mb-2">{error}</div>
          )}
          <div className="w-64 h-64 bg-white/10 rounded-2xl flex items-center justify-center text-zinc-400 border border-white/10 shadow-inner backdrop-blur-md overflow-hidden">
            {image ? (
              <img
                src={image}
                alt="Generated visual"
                className="object-cover w-full h-full rounded-2xl"
                style={{ background: "rgba(0,0,0,0.1)" }}
              />
            ) : loading ? (
              <span className="text-zinc-400 animate-pulse">Generating...</span>
            ) : (
              <span>Image preview</span>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <button
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg px-7 py-3 transition-all duration-150 shadow-sm focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50"
              onClick={handleDownload}
              disabled={!image}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Download
            </button>
            <button
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg px-7 py-3 transition-all duration-150 shadow-sm focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50"
              disabled={!image}
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={() => setShowModal(true)}
            >
              Coin It
            </button>
          </div>
        </div>
      </div>
      {/* Coin It Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 relative flex flex-col gap-6">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-4 text-zinc-400 hover:text-zinc-200 text-2xl">&times;</button>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Mint as Zora Coin</h2>
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleMintCoin(); }}>
              <input type="text" placeholder="Coin Name" className="rounded-lg px-3 py-2 bg-white/10 text-zinc-100 placeholder:text-zinc-400" value={coinName} onChange={e => setCoinName(e.target.value)} required />
              <input type="text" placeholder="$Ticker" className="rounded-lg px-3 py-2 bg-white/10 text-zinc-100 placeholder:text-zinc-400" value={coinSymbol} onChange={e => setCoinSymbol(e.target.value)} required />
              <textarea placeholder="Description" className="rounded-lg px-3 py-2 bg-white/10 text-zinc-100 placeholder:text-zinc-400" value={coinDesc} onChange={e => setCoinDesc(e.target.value)} rows={2} required />
              <div className="rounded-lg px-3 py-2 bg-white/5 text-zinc-400 text-sm select-none">You receive 10,000,000</div>
              {/* Wallet Connect UI - MetaMask only */}
              <div className="flex flex-col gap-2 mt-2">
                {isConnected ? (
                  <div className="text-zinc-100">{address}</div>
                ) : (
                  <button
                    className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg px-7 py-3 transition-all duration-150 shadow-sm focus:ring-2 focus:ring-zinc-400 focus:outline-none"
                    onClick={handleConnect}
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>
              {isConnected && chainId !== BASE_MAINNET_ID && (
                <div className="bg-yellow-900/80 text-yellow-300 rounded-lg px-3 py-2 text-sm mb-2 flex flex-col gap-2">
                  <span>⚠️ Please switch to Base mainnet to mint your coin.</span>
                  <button
                    className="bg-yellow-800 hover:bg-yellow-700 text-yellow-100 font-medium rounded px-4 py-2 mt-1"
                    onClick={handleSwitchToBase}
                  >
                    Switch to Base Mainnet
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg px-7 py-3 mt-2 transition-all duration-150 shadow-sm focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50"
                disabled={!isConnected || chainId !== BASE_MAINNET_ID}
              >
                Mint Coin
              </button>
              {/* Minting status and result */}
              {mintStatus && (
                <div className={
                  mintStatus.startsWith("Error")
                    ? "bg-red-900/70 text-red-300 rounded-lg px-3 py-2 mt-3 text-sm"
                    : "bg-zinc-800/70 text-zinc-100 rounded-lg px-3 py-2 mt-3 text-sm"
                }>
                  {mintStatus}
                </div>
              )}
              {mintedCoin && (
                <div className="bg-green-900/70 text-green-300 rounded-lg px-3 py-2 mt-2 text-sm break-all">
                  Minted Coin Address: {mintedCoin}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


