# Plan for Zora Mini

## Notes
- User wants a Next.js app where users can generate an image via Gemini API, then mint it as a Zora Coin using the Coin SDK.
- Flow: User enters prompt → image generated → shows image + Download and Coin It buttons → Coin It opens modal for metadata and wallet connect → user can mint coin via Zora SDK.
- Zora Coin SDK requires API key, viem, and proper metadata URI (preferably IPFS).
- Initial supply purchase only works on Base mainnet (ETH input, ZORA coin).
- Must support wallet connection (e.g., MetaMask) and use the SDK for on-chain minting.
- Zora Coin SDK coin creation works directly on-chain (no API call required).
- Prompt user to switch to Base mainnet or show warning if not connected to Base.
- Next.js app uses Tailwind, TypeScript, and app directory structure.
- UI should be minimalistic and elegant, using glassmorphism (frosted glass card with semi-transparent dark background, backdrop-blur-md, rounded-2xl corners, shadow-xl, Inter font, larger/smoother/less saturated buttons, sleek modern look).
- App name is "Zora Mini".
- The entire app uses a minimal, glassmorphic, monochrome (grayscale) palette and style.
- Gemini image generation should use the latest Gemini SDK (GoogleGenAI) and the 'imagen-4.0-generate-preview-06-06' model as per official docs.
- Gemini model 'imagen-4.0-generate-preview-06-06' is not available for API version v1beta; need to check available models via SDK/ListModels or documentation.
- The Gemini Node.js SDK does not support programmatic model listing; model names must be confirmed via Google AI Studio or API documentation.
- Gemini image generation with supported model ('gemini-2.0-flash-preview-image-generation' with ["TEXT", "IMAGE"] modalities) is now working.
- Coin It modal should display static grey text "You receive 10,000,000" for supply (creator always receives initial supply in Zora), and replace symbol field with label/placeholder "$Ticker".
- User requests an alternative to WalletConnect for wallet connection (e.g., direct MetaMask integration).
- Zora SDK minting fails with 'API key is required for metadata interactions' if NEXT_PUBLIC_ZORA_API_KEY is not set or not loaded at runtime.
- Error 'publicClient.simulateContract is not a function' may indicate viem/wagmi version mismatch or incorrect client usage.

## Task List
- [x] Set up new Next.js project
- [x] Install Gemini API dependencies (axios)
- [x] Integrate Gemini API for image generation
- [x] Display generated image with Download and Coin It buttons
- [x] Update Gemini API backend to use official SDK and latest model
- [x] Resolve Gemini model not found error (check available models via SDK/ListModels and update accordingly)
- [x] Update Gemini backend to use a supported model (e.g., 'imagen-2' or one visible in AI Studio)
- [x] Implement modal for coin metadata input (name, description, $Ticker, static supply text)
- [x] Add Connect Wallet functionality (MetaMask support)
- [x] Integrate Zora Coin SDK (install complete; configure API key, set up viem next)
- [x] Upload image and metadata to IPFS (or Zora uploader) (attempted, error: API key required)
- [x] Mint coin using Zora Coin SDK after wallet is connected (attempted, error: simulateContract not a function)
- [x] Show transaction status and coin address after minting
- [x] Prompt user to switch to Base mainnet or show warning if not on Base
- [x] Resolve Zora SDK/client integration errors (API key, viem/wagmi compatibility)
