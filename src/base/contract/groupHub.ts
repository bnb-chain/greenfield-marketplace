// import { useGetChainProviders } from './useGetChainProviders';
import Web3 from 'web3';
import ABI from './group_hub_abi.json';
import { AbiItem } from 'web3-utils';
import { BSC_RPC_URL, GROUP_HUB_CONTRACT_ADDRESS } from '../../env/';

const cache: any = {};
export const GroupHubContract = (sign = true) => {
  if (cache[sign + '']) return cache[sign + ''];
  let web3;
  if (sign) {
    web3 = new Web3(window.ethereum as any);
  } else {
    const gfProvider = new Web3.providers.HttpProvider(BSC_RPC_URL);
    web3 = new Web3(gfProvider);
  }

  const contractInstance = new web3.eth.Contract(
    ABI as AbiItem[],
    GROUP_HUB_CONTRACT_ADDRESS,
  );
  if (!cache[sign + '']) cache[sign + ''] = contractInstance;
  return contractInstance;
};
