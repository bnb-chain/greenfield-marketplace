import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { Box, Button, Table } from '@totejs/uikit';
import { usePagination } from '../../hooks/usePagination';
import { useAccount, useSwitchNetwork } from 'wagmi';
import { getBucketFileList } from '../../utils/gfSDK';
import {
  contentTypeToExtension,
  divide10Exp,
  formatDateUTC,
  parseFileSize,
} from '../../utils/';
import { ListModal } from '../modal/listModal';
import { GF_CHAIN_ID } from '../../env';
import { useCollectionItems } from '../../hooks/useCollectionItems';
import { useSalesVolume } from '../../hooks/useSalesVolume';
import { useModal } from '../../hooks/useModal';
import { useDelist } from '../../hooks/useDelist';
import { toast } from '@totejs/uikit';
import { BN } from 'bn.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGlobal } from '../../hooks/useGlobal';
import { GoIcon } from '@totejs/icons';

const TotalVol = (props: any) => {
  const { groupId } = props;
  const { salesVolume } = useSalesVolume(groupId);
  return <div>{salesVolume}</div>;
};

const ProfileList = (props: any) => {
  const { name, bucketName } = props;

  const { list, loading } = useCollectionItems(name);

  const { handlePageChange, page } = usePagination();

  const modalData = useModal();
  const { delist } = useDelist();

  const { address } = useAccount();

  const navigate = useNavigate();

  const [p] = useSearchParams();
  const bucketId = p.getAll('bid')[0];
  const ownerAddress = p.getAll('address')[0];

  const state = useGlobal();

  const navigator = useNavigate();

  const columns = [
    {
      header: 'Data',
      cell: (data: any) => {
        const object_name = data.children
          ? data.name
          : data?.object_info?.object_name;
        return <div>{object_name}</div>;
      },
    },
    {
      header: 'Type',
      width: 160,
      cell: (data: any) => {
        const content_type = data.children
          ? 'Folder'
          : contentTypeToExtension(data?.object_info?.content_type);
        return <div>{content_type}</div>;
      },
    },
    {
      header: 'Size',
      width: 160,
      cell: (data: any) => {
        return (
          <div>
            {data.children
              ? '-'
              : parseFileSize(data?.object_info?.payload_size)}
          </div>
        );
      },
    },
    {
      header: 'Data Created',
      width: 120,
      cell: (data: any) => {
        return (
          <div>
            {data.children
              ? '-'
              : formatDateUTC(data?.object_info?.create_at * 1000)}
          </div>
        );
      },
    },
    {
      header: 'Price',
      cell: (data: any) => {
        const { price } = data;
        const balance = divide10Exp(new BN(price, 10), 18);
        return <div>{balance} BNB</div>;
      },
    },
    {
      header: 'Total Vol',
      cell: (data: any) => {
        const { groupId } = data;
        return <TotalVol groupId={groupId}></TotalVol>;
      },
    },
    {
      header: 'Action',
      cell: (data: any) => {
        const { object_info, listed, groupId, name } = data;
        if (!object_info)
          return (
            <GoIcon
              cursor={'pointer'}
              color={'#AEB4BC'}
              onClick={() => {
                const list = state.globalState.breadList;
                const item = {
                  path: '/resource',
                  name: bucketName,
                  query: p.toString(),
                };
                state.globalDispatch({
                  type: 'ADD_BREAD',
                  item,
                });

                const from = encodeURIComponent(
                  JSON.stringify(list.concat([item])),
                );

                navigator(
                  `/folder?bid=${bucketId}&f=${name}&address=${ownerAddress}&from=${from}`,
                );
              }}
            />
          );
        const { owner, id } = object_info;
        return (
          <div>
            {owner === address && (
              <Button
                size={'sm'}
                onClick={async () => {
                  sessionStorage.setItem('resource_type', '1');
                  if (!listed) {
                    modalData.modalDispatch({
                      type: 'OPEN_LIST',
                      initInfo: object_info,
                    });
                  } else {
                    console.log(groupId);
                    try {
                      await delist(groupId);
                      toast.success({ description: 'buy successful' });
                    } catch (e) {
                      toast.error({ description: 'buy failed' });
                    }
                  }
                }}
              >
                {!listed ? 'List' : 'Delist'}
              </Button>
            )}

            <Button
              onClick={() => {
                const list = state.globalState.breadList;
                const item = {
                  path: '/resource',
                  name: bucketName || 'Collection',
                  query: p.toString(),
                };
                state.globalDispatch({
                  type: 'ADD_BREAD',
                  item,
                });
                console.log(
                  encodeURIComponent(JSON.stringify(list.concat([item]))),
                );
                navigate(
                  `/resource?oid=${id}&address=${address}&tab=description&from=${encodeURIComponent(
                    JSON.stringify(list.concat([item])),
                  )}`,
                );
              }}
              size={'sm'}
              style={{ marginLeft: '6px' }}
            >
              View detail
            </Button>
          </div>
        );
      },
    },
  ];
  return (
    <Container>
      <Box h={10} />
      <Table
        headerContent={`Latest ${Math.min(20, list.length)}  Data (Total of ${
          list.length
        })`}
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
  width: 996px;
`;
