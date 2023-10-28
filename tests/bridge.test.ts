import { Token } from '../src/contracts/bridge'
import { assert, ByteString, method, prop, SmartContract } from 'scrypt-ts'
import { DefaultProvider, SensiletSigner, PubKey, toHex, sha256, toByteString, bsv, MethodCallOptions, findSig, SignatureResponse } from "scrypt-ts";
import { getDefaultSigner, inputSatoshis, randomPrivateKey } from './utils/txHelper'
import { myPublicKey } from './utils/privateKey';

async function main() {

  const key = randomPrivateKey();

  const myPubkey = key[1];

  const Token_Name = "Wrapped Ether";
  const Token_Symbol = "WETH";

  const Data_On_chain = "...................................... Token_Name:" + Token_Name + "Token_Symbol:" + Token_Symbol + ".................................."

  const hash = "test"

  await Token.compile()
  const demo = new Token(PubKey(toHex(myPubkey)), toByteString(Data_On_chain, true), toByteString(hash, true))

  // connect to a signer
  await demo.connect(getDefaultSigner())

  // contract deployment
  const deployTx = await demo.deploy(inputSatoshis)
  console.log('Demo contract deployed: ', deployTx.id)

  // contract call
  const { tx: callTx } = await demo.methods.unlock(toByteString("Hello World", true))
  console.log('Demo contract `add` called: ', callTx.id)
}

describe('Test SmartContract `Demo` on testnet', () => {
  it('should succeed', async () => {
    await main()
  })
})
