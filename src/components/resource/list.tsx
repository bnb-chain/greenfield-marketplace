import styled from '@emotion/styled';
import { Box, Button, Flex, Table } from '@totejs/uikit';
import { usePagination } from '../../hooks/usePagination';
import { useAccount } from 'wagmi';
import {
  contentTypeToExtension,
  defaultImg,
  divide10Exp,
  formatDateUTC,
  parseFileSize,
} from '../../utils/';
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
  return <div>{Number(salesVolume) || '-'}</div>;
};

const ProfileList = (props: any) => {
  const { name, bucketName, listed: collectionListed } = props;

  const { list, loading } = useCollectionItems(name, collectionListed);

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
      width: '200px',
      cell: (data: any) => {
        const { object_info } = data;
        const object_name = data.children
          ? data.name
          : data?.object_info?.object_name;

        return (
          <ImgContainer
            alignItems={'center'}
            justifyContent={'flex-start'}
            gap={6}
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

              const from = encodeURIComponent(
                JSON.stringify(list.concat([item])),
              );

              if (!object_info) {
                navigator(
                  `/folder?bid=${bucketId}&f=${name}&address=${ownerAddress}&from=${from}`,
                );
              } else {
                const { id } = object_info;
                navigate(
                  `/resource?oid=${id}&address=${address}&tab=description&from=${from}`,
                );
              }
            }}
          >
            <ImgCon src={defaultImg(object_name, 40)}></ImgCon>
            {object_name}
          </ImgContainer>
        );
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
        return <div>{Number(balance) ? `${balance} BNB` : '-'}</div>;
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
                  `/folder?bid=${bucketId}&f=${name}&address=${ownerAddress}&collectionListed=${collectionListed}&from=${from}`,
                );
              }}
            />
          );
        const { owner } = object_info;
        return (
          <div>
            {owner === address && !collectionListed && (
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

const ImgContainer = styled(Flex)`
  cursor: pointer;
  color: ${(props: any) => props.theme.colors.scene.primary.normal};
`;

const ImgCon = styled.img`
  width: 40px;
  height: 40px;

  background: #d9d9d9;
  border-radius: 8px;
`;
