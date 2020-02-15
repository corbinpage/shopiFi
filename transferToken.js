const ethers = require('ethers');

const {
  dynamoDbLibCall,
  getMessageFromSNS,
  convertTokenToWei
  } = require('./utils');

const {
  getProvider,
  getWallet,
  getcTokenContract,
  getDaiTokenContract,
  createEthTransaction,
  updateEthTransaction
  } = require('./eth_utils');

module.exports.start = async (event) => {
  const data = {
    network: 'homestead', // 'homestead'
    amount: event.amount || 1,
    toAddress: event.toAddress || '0x869eC00FA1DC112917c781942Cc01c68521c415e',
    tokenSymbol: event.tokenSymbol || 'DAI'
  }

  const provider = getProvider(data.network)
  const wallet = getWallet(provider)
  const contract = await getDaiTokenContract(provider, wallet)

  let tx = await contract.transfer(
    data.toAddress,
    convertTokenToWei(data.amount)
  )
  let record = await createEthTransaction(tx, data.network)
  // console.log('Pending tx', tx)

  let finalTx = await tx.wait()
  // console.log('Final tx', finalTx)
  record = await updateEthTransaction(finalTx)

  return finalTx
}