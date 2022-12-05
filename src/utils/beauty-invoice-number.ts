export const beautyInvoiceNumber = (n: number) => {
    return n.toString().padStart(6, "0")
}