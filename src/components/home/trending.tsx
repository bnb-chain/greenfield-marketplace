import styled from '@emotion/styled';
import { Button, Flex, Table } from '@totejs/uikit';
import { usePagination } from '../../hooks/usePagination';
import { useNavigate } from 'react-router-dom';
import { defaultImg, divide10Exp, trimLongStr } from '../../utils';
import BN from 'bn.js';

import { useTrendingList } from '../../hooks/useTrendingList';

const TrendingList = () => {
  const { handlePageChange, page } = usePagination();

  const navigator = useNavigate();

  const { list, loading } = useTrendingList();

  const columns = [
    {
      header: '#',
      cell: (data: any) => {
        const { rank } = data;
        return <div>{rank}</div>;
      },
    },
    {
      header: 'Data Collection',
      cell: (data: any) => {
        const { name, url } = data;
        return (
          <ImgContainer
            alignItems={'center'}
            justifyContent={'flex-start'}
            gap={6}
          >
            <ImgCon src={url || defaultImg(name, 40)}></ImgCon>
            {name}
          </ImgContainer>
        );
      },
    },
    {
      header: 'Type',
      width: 160,
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
      header: 'Total Vol',
      width: 120,
      cell: (data: any) => {
        const { totalVol } = data;
        return <div>{totalVol}</div>;
      },
    },
    {
      header: 'Creator',
      cell: (data: any) => {
        const { ownerAddress } = data;
        return <div>{trimLongStr(ownerAddress)}</div>;
      },
    },
  ];
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

export default TrendingList;

const Container = styled.div`
  width: 1123px;
`;

const ImgContainer = styled(Flex)``;

const ImgCon = styled.img`
  width: 40px;
  height: 40px;

  background: #d9d9d9;
  border-radius: 8px;
`;