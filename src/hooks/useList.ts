import {
  CreateGroup,
  getGroupInfoByName,
  mirrorGroup,
  multiTx,
  putBucketPolicy,
  putObjectPolicy,
} from '../utils/gfSDK';
import {
  ISimulateGasFee,
  PermissionTypes,
  TimestampTypes,
} from '@bnb-chain/greenfield-chain-sdk';
import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';

import { MarketPlaceContract } from '../base/contract/marketPlaceContract';
import { useModal } from './useModal';
import { parseGroupName } from '../utils';

export const useList = () => {
  const [simulateInfo, setSimulateInfo] = useState<ISimulateGasFee>();

  const { address, connector } = useAccount();

  const stateModal = useModal();

  const InitiateList = useCallback(
    async (obj: { groupName: string; extra: string }) => {
      console.log(obj, '----InitiateList params');

      const { groupName } = obj;
      const groupResult = await getGroupInfoByName(
        groupName,
        address as string,
      );
      const { groupInfo } = groupResult;
      console.log(groupInfo, groupResult, '------groupInfo');
      // groupname has created
      if (groupInfo) {
        stateModal.modalDispatch({
          type: 'UPDATE_LIST_STATUS',
          initListStatus: 1,
          initListResult: {},
        });
        return;
      }
      let tmp = {};
      try {
        const { groupName, extra } = obj;

        const createGroupTx = await CreateGroup({
          creator: address as string,
          groupName: groupName,
          members: [address as string],
          extra,
        });

        const mirrorGroupTx = await mirrorGroup(
          groupName,
          '0',
          address as string,
        );

        let policyTx;
        const { name, bucketName, type } = parseGroupName(groupName);

        if (type === 'Collection') {
          const statement: PermissionTypes.Statement = {
            effect: PermissionTypes.Effect.EFFECT_ALLOW,
            actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
            resources: [''],
          };
          policyTx = await putBucketPolicy(bucketName, {
            operator: address,
            statements: [statement],
            principal: {
              type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
              value: '0x0000000000000000000000000000000000000001',
            },
          });
        } else {
          const statement: PermissionTypes.Statement = {
            effect: PermissionTypes.Effect.EFFECT_ALLOW,
            actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
            resources: [''],
          };
          policyTx = await putObjectPolicy(bucketName, name, {
            operator: address,
            statements: [statement],
            principal: {
              type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
              value: '0x0000000000000000000000000000000000000001',
            },
          });
        }

        const { simulate, broadcast } = await multiTx([
          createGroupTx,
          mirrorGroupTx,
          policyTx,
        ]);

        const simulateMultiTxInfo = await simulate({
          denom: 'BNB',
        });

        setSimulateInfo(simulateMultiTxInfo);

        console.log(simulateMultiTxInfo, '-------simulateMultiTxInfo');

        const res = await broadcast({
          denom: 'BNB',
          gasLimit: Number(simulateMultiTxInfo.gasLimit) * 2,
          gasPrice: simulateMultiTxInfo.gasPrice,
          payer: address as string,
          granter: '',
          signTypedDataCallback: async (addr: string, message: string) => {
            console.log(connector);
            const provider = await connector?.getProvider();
            return await provider?.request({
              method: 'eth_signTypedData_v4',
              params: [addr, message],
            });
          },
        });

        if (res.code === 0) {
          console.log(res, '-----InitiateList result');
          stateModal.modalDispatch({
            type: 'UPDATE_LIST_STATUS',
            initListStatus: 1,
            initListResult: res,
          });
        } else {
          tmp = {
            variant: 'error',
            description: 'Mirror failed',
          };
        }
        return res;
      } catch (e: any) {
        console.log(e, '----InitiateList Error');
        tmp = {
          variant: 'error',
          description: e.message ? e.message : 'Mirror failed',
        };
      }
      stateModal.modalDispatch({
        type: 'OPEN_RESULT',
        result: tmp,
      });
    },
    [connector],
  );

  const List = useCallback(
    async (obj: { groupName: string; extra: string }) => {
      const { groupName } = obj;
      const { groupInfo } = await getGroupInfoByName(
        groupName,
        address as string,
      );

      if (!groupInfo) return;
      const { id } = groupInfo;
      let { extra } = groupInfo as any;
      extra = JSON.parse(extra);
      const { price } = extra;
      console.log(id, price, '-------list info');
      const result = await MarketPlaceContract()
        .methods.list(id, price)
        .send({ from: address });

      console.log(result, '-----list result');
      return result;
    },
    [],
  );

  return {
    InitiateList,
    simulateInfo,
    List,
  };
};
