import styled from '@emotion/styled';
import { Button, Flex, Table } from '@totejs/uikit';
import { usePagination } from '../../hooks/usePagination';
import { useNavigate } from 'react-router-dom';
import {
  formatDateUTC,
  trimLongStr,
  divide10Exp,
  delay,
  defaultImg,
} from '../../utils';
import { useGetListed } from '../../hooks/useGetListed';
import BN from 'bn.js';
import { useAccount, useSwitchNetwork } from 'wagmi';
import { useStatus } from '../../hooks/useStatus';
import { useSalesVolume } from '../../hooks/useSalesVolume';
import { useModal } from '../../hooks/useModal';

const ActionCom = (obj: any) => {
  const navigator = useNavigate();
  const { data, address } = obj;
  const { id, groupName, ownerAddress, type, price } = data;

  const { status } = useStatus(groupName, ownerAddress, address);

  const modalData = useModal();
  return (
    <ButtonCon gap={6}>
      {status == 1 && (
        <Button
          size={'sm'}
          onClick={async () => {
            modalData.modalDispatch({
              type: 'OPEN_BUY',
              buyData: data,
            });
          }}
        >
          Buy
        </Button>
      )}
      <Button
        onClick={() => {
          navigator(
            `/resource?gid=${id}&gn=${groupName}&address=${ownerAddress}&tab=description`,
          );
        }}
        size={'sm'}
      >
        View detail
      </Button>
    </ButtonCon>
  );
};

interface ITotalVol {
  id: string;
}
const TotalVol = (props: ITotalVol) => {
  const { id } = props;
  const { salesVolume } = useSalesVolume(id);
  return <div>{salesVolume}</div>;
};
const AllList = () => {
  const { handlePageChange, page } = usePagination();

  const navigator = useNavigate();

  const { list, loading } = useGetListed();
  const { address } = useAccount();

  const columns = [
    {
      header: 'Data',
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
        return <div>{listTime ? formatDateUTC(listTime * 1000) : '-'}</div>;
      },
    },
    {
      header: 'Total Vol',
      width: 120,
      cell: (data: any) => {
        const { id } = data;
        return <TotalVol id={id}></TotalVol>;
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

export default AllList;

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

const ButtonCon = styled(Flex)``;