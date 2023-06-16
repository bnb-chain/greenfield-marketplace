import styled from '@emotion/styled';
import { Button, Table } from '@totejs/uikit';
import { usePagination } from '../../hooks/usePagination';
import { useAccount, useSwitchNetwork } from 'wagmi';
import { getBucketList } from '../../utils/gfSDK';
import { GF_CHAIN_ID } from '../../env';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { divide10Exp, formatDateUTC, trimLongStr } from '../../utils/';
import { useUserPurchased } from '../../hooks/useUserPurchased';
import BN from 'bn.js';
import { useSalesVolume } from '../../hooks/useSalesVolume';

const ActionCom = (obj: any) => {
  const navigator = useNavigate();
  const { data, address } = obj;
  const { id, groupName, ownerAddress, type, price } = data;
  const disableBuy = address === ownerAddress;
  const { switchNetwork } = useSwitchNetwork();

  return (
    <div>
      <Button
        onClick={() => {
          navigator(
            `/resource?gid=${id}&gn=${groupName}&address=${ownerAddress}&type=collection&tab=description`,
          );
        }}
        size={'sm'}
        style={{ marginLeft: '6px' }}
      >
        View detail
      </Button>
    </div>
  );
};

const TotalVol = (props: any) => {
  const { groupId } = props;
  const { salesVolume } = useSalesVolume(groupId);
  return <div>{Number(salesVolume) || '-'}</div>;
};

const PurchaseList = () => {
  const { handlePageChange, page } = usePagination();

  const { list, loading } = useUserPurchased();
  const { address } = useAccount();

  const columns = [
    {
      header: 'Data',
      cell: (data: any) => {
        const { name } = data;
        return <div>{name}</div>;
      },
    },
    {
      header: 'Type',
      cell: (data: any) => {
        const { type } = data;
        return <div>{type}</div>;
      },
    },
    {
      header: 'Price',
      width: 160,
      cell: (data: any) => {
        const { price } = data;
        const balance = divide10Exp(new BN(price, 10), 18);
        return <div>{balance} BNB</div>;
      },
    },
    {
      header: 'Data Listed',
      width: 160,
      cell: (data: any) => {
        const { listTime } = data;
        return <div>{formatDateUTC(listTime * 1000)}</div>;
      },
    },
    {
      header: 'Total Vol',
      width: 120,
      cell: (data: any) => {
        const { id } = data;
        return <TotalVol groupId={id}></TotalVol>;
      },
    },
    {
      header: 'Creator',
      width: 120,
      cell: (data: any) => {
        const { ownerAddress } = data;
        return <div>{trimLongStr(ownerAddress)}</div>;
      },
    },
    {
      header: 'Action',
      cell: (data: any) => {
        return <ActionCom data={data} address={address}></ActionCom>;
      },
    },
  ];
  console.log(list);
  return (
    <Container>
      <Table
        headerContent={`Latest ${Math.min(
          20,
          list.length,
        )}  Collections (Total of ${list.length})`}
        containerStyle={{ padding: 20 }}
        pagination={{
          current: page,
          pageSize: 20,
          total: list.length,
          onChange: handlePageChange,
        }}
        columns={columns}
        data={list}
        loading={loading}
      />
    </Container>
  );
};

export default PurchaseList;

const Container = styled.div`
  width: 1123px;
`;