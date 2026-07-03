import { Client, Wallet, EscrowCreate, EscrowFinish, EscrowCancel, xrpToDrops, dropsToXrp } from "xrpl";
import { logger } from "./logger";

const XRPL_SERVER = process.env.XRPL_SERVER ?? "wss://s.altnet.rippletest.net:51233";

export async function getXrplClient(): Promise<Client> {
  const client = new Client(XRPL_SERVER);
  await client.connect();
  return client;
}

export async function createEscrow(params: {
  senderWallet: string;
  destinationWallet: string;
  amountXrp: number;
  finishAfterSeconds?: number;
}): Promise<{ txHash: string; sequence: number } | null> {
  const client = await getXrplClient();
  try {
    const fundingWallet = Wallet.fromSeed(process.env.PLATFORM_WALLET_SEED ?? "");
    const finishAfter = new Date();
    finishAfter.setSeconds(finishAfter.getSeconds() + (params.finishAfterSeconds ?? 86400));

    const escrowTx: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: fundingWallet.address,
      Amount: xrpToDrops(params.amountXrp),
      Destination: params.destinationWallet,
      FinishAfter: Math.floor(finishAfter.getTime() / 1000) - 946684800,
    };

    const prepared = await client.autofill(escrowTx);
    const signed = fundingWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txHash = signed.hash;
    const sequence = (prepared as any).Sequence as number;

    logger.info({ txHash, sequence }, "XRPL EscrowCreate submitted");
    return { txHash, sequence };
  } catch (err) {
    logger.error({ err }, "Failed to create XRPL escrow");
    return null;
  } finally {
    await client.disconnect();
  }
}

export async function finishEscrow(params: {
  ownerAddress: string;
  escrowSequence: number;
}): Promise<{ txHash: string } | null> {
  const client = await getXrplClient();
  try {
    const fundingWallet = Wallet.fromSeed(process.env.PLATFORM_WALLET_SEED ?? "");

    const finishTx: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: fundingWallet.address,
      Owner: params.ownerAddress,
      OfferSequence: params.escrowSequence,
    };

    const prepared = await client.autofill(finishTx);
    const signed = fundingWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    logger.info({ txHash: signed.hash }, "XRPL EscrowFinish submitted");
    return { txHash: signed.hash };
  } catch (err) {
    logger.error({ err }, "Failed to finish XRPL escrow");
    return null;
  } finally {
    await client.disconnect();
  }
}

export async function cancelEscrow(params: {
  ownerAddress: string;
  escrowSequence: number;
}): Promise<{ txHash: string } | null> {
  const client = await getXrplClient();
  try {
    const fundingWallet = Wallet.fromSeed(process.env.PLATFORM_WALLET_SEED ?? "");

    const cancelTx: EscrowCancel = {
      TransactionType: "EscrowCancel",
      Account: fundingWallet.address,
      Owner: params.ownerAddress,
      OfferSequence: params.escrowSequence,
    };

    const prepared = await client.autofill(cancelTx);
    const signed = fundingWallet.sign(prepared);
    await client.submitAndWait(signed.tx_blob);

    logger.info({ txHash: signed.hash }, "XRPL EscrowCancel submitted");
    return { txHash: signed.hash };
  } catch (err) {
    logger.error({ err }, "Failed to cancel XRPL escrow");
    return null;
  } finally {
    await client.disconnect();
  }
}

export function generateMockEscrowData(): { txHash: string; sequence: number } {
  const chars = "0123456789ABCDEF";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return {
    txHash: hash,
    sequence: Math.floor(Math.random() * 9000000) + 1000000,
  };
}
