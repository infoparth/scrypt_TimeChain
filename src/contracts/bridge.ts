import {
    assert,
    hash256,
    sha256,
    method,
    prop,
    PubKey,
    Sig,
    SmartContract,
    ByteString,
    
} from 'scrypt-ts'

export class Token extends SmartContract {
    // the public key of issuer
    @prop()
    m: ByteString

    @prop()
    readonly ownerPubKey: PubKey

    // the public key of current user
    @prop(true)
    userPubKey: PubKey

    @prop(true)
    hashX: ByteString

    @prop(true)
    value: bigint

    constructor(owner: PubKey, message: ByteString) {
        super(...arguments)
        this.ownerPubKey = owner
        this.userPubKey = owner // the first user is the issuer himself
        this.m = message
    }

    @method()
    public transfer(
        receiverPubKey: PubKey, // send to
        hashRecieved: ByteString
    ) {
        assert(this.hashX != '' && sha256(hashRecieved) == sha256(this.hashX))

        const satoshisSent = this.value  // send amount

        // total satoshis locked in this contract utxo
        const satoshisTotal = this.ctx.utxo.value
        
        // require the amount requested to be transferred is valid

        assert(
            satoshisSent > 0 && satoshisSent <= satoshisTotal,
            `invalid value of satoshisSent, should be greater than 0 and less than or equal to ${satoshisTotal}`
        )

        // temp record previous user
        const previousUserPubKey = this.userPubKey

        // construct all the outputs of the method calling tx

        // the output send to receiver
        this.userPubKey = receiverPubKey
        let outputs = this.buildStateOutput(satoshisSent)

        // the change output back to previous user
        const satoshisLeft = satoshisTotal - satoshisSent
        if (satoshisLeft > 0) {
            this.userPubKey = previousUserPubKey
            outputs += this.buildStateOutput(satoshisLeft)
        }

        // // the change output for paying the transaction fee
        if (this.changeAmount > 0) {
            outputs += this.buildChangeOutput()
        }

        this.hashX = ''
        this.value = 0n

        // require all of these outputs are actually in the unlocking transaction
        assert(
            hash256(outputs) == this.ctx.hashOutputs,
            'hashOutputs check failed'
        )
    }

    @method()
    public setHashAndValue(issuerSig: Sig, stringToBeHashed: ByteString, valueTobeSent: bigint) {
        assert(
            this.checkSig(issuerSig, this.ownerPubKey),
            "issuer's signature check failed"
        )

        this.hashX = stringToBeHashed //setting the new hash for the next transaction

        this.value = valueTobeSent //setting the value that needs to be sent to the user
    }
}
