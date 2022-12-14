// Preparing for overdue cronjob
const invoiceJob = async (container, options) => {
    // const eventBus = container.resolve("eventBusService");
    // eventBus.createCronJob("invoice-overdue", {}, "* * * * *", async () => {
    //     //job to execute
    //     const productService = container.resolve("productService");
    //     const draftProducts = await productService.list({});

    //     console.log(draftProducts)
    // })
}

export default invoiceJob;