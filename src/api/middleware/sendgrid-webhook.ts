import { NextFunction, Request, RequestHandler, Response } from 'express';
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook';

const verifyRequest = function (publicKey, payload, signature, timestamp) {
    const event = new EventWebhook();
    const ecPublicKey = event.convertPublicKeyToECDSA(publicKey);
    return event.verifySignature(ecPublicKey, payload, signature, timestamp);
}

export default (): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Todo Verify signature for Security Reason
        // const sgSignature = req.get(EventWebhookHeader.SIGNATURE())
        // const sgTimestamp = req.get(EventWebhookHeader.TIMESTAMP())
        // const pubKey = process.env.INVOICE_SENDGRID_EVENT_WEBHOOK_KEY
        // const payload = req.body
        
        // if (!verifyRequest(pubKey, payload, sgSignature, sgTimestamp)) {
        //     return res.status(401).json({
        //         message: "Signature Key is not valid!",
        //     })
        // }

        // Temp Security Webhook
        if (!req.query || req.query.token != process.env.INVOICE_SENDGRID_EVENT_WEBHOOK_TOKEN) {
            return res.status(401).json({
                message: "Token is not valid!",
            })
        }

        next()
  }
}