import styled from '@emotion/styled';
import { NavBar } from './NavBar';
import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Table } from '@totejs/uikit';
import { usePagination } from '../hooks/usePagination';
import { useAccount } from 'wagmi';
import { getBucketList } from '../utils/gfSDK';

enum Type {
  Collections = 'Collections',
  Purchase = 'All',
}
const navItems = [
  {
    name: 'My Collections',
    key: Type.Collections,
  },
  {
    name: 'My Purchase',
    key: Type.Purchase,
  },
];

const ProfileList = () => {
  const { handlePageChange, page } = usePagination();

  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const currentTab = Type.Collections;
  const handleTabChange = useCallback((tab: any) => {
    console.log(tab);
  }, []);

  useEffect(() => {
    getBucketList(address as string).then((result: any) => {
      setLoading(false);
      const { statusCode, body } = result;
      if (statusCode == 200 && Array.isArray(body)) {
        setList(body as any);
      }
      console.log(result);
    });
  }, [address]);

  const columns = [
    {
      header: 'Data Collection',
      cell: (data: any) => {
        const {
          bucket_info: { bucket_name },
        } = data;
        return <div>{bucket_name}</div>;
      },
    },
    {
      header: 'Data Created',
      width: 160,
      cell: (data: any) => {
        const {
          bucket_info: { create_at },
        } = data;
        return <div>{create_at}</div>;
      },
    },
    {
      header: 'Price',
      width: 160,
      cell: (data: any) => {
        return <div>-</div>;
      },
    },
    {
      header: 'Total Vol',
      width: 120,
      cell: (data: any) => {
        return <div>-</div>;
      },
    },
    {
      header: 'Action',
      cell: (data: any) => {
        return (
          <div>
            <Button size={'sm'}>List</Button>
            <Button size={'sm'} style={{ marginLeft: '6px' }}>
              View detail
            </Button>
          </div>
        );
      },
    },
  ];
  return (
    <Container>
      <NavBar active={currentTab} onChange={handleTabChange} items={navItems} />
      <Box h={20} />
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

export default ProfileList;

const Container = styled.div`
  margin-top: 30px;

  width: 1123px;
  height: 664px;
`;
