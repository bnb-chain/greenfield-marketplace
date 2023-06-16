import styled from '@emotion/styled';
import { Flex, Button, Box } from '@totejs/uikit';
import { NavBar } from '../components/NavBar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Overview from '../components/resource/overview';
import List from '../components/resource/list';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EditModal } from '../components/modal/editModal';
import { GF_CHAIN_ID } from '../env';
import { useAccount, useSwitchNetwork } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useResourceInfo } from '../hooks/useResourceInfo';
import { Loader } from '../components/Loader';
import {
  defaultImg,
  divide10Exp,
  generateGroupName,
  trimLongStr,
  formatDateUTC,
} from '../utils';
import BN from 'bn.js';
import { useCollectionItems } from '../hooks/useCollectionItems';
import { useSalesVolume } from '../hooks/useSalesVolume';
import { useListedDate } from '../hooks/useListedDate';
import { useStatus } from '../hooks/useStatus';
import { useModal } from '../hooks/useModal';
import { PenIcon } from '@totejs/icons';

enum Type {
  Description = 'description',
  DataList = 'dataList',
}
const navItems = [
  {
    name: 'Description',
    key: Type.Description,
  },
];

const Resource = () => {
  const navigator = useNavigate();
  const [p] = useSearchParams();
  const tab = p.getAll('tab')[0];
  const groupId = p.getAll('gid')[0];
  const bucketId = p.getAll('bid')[0];
  const objectId = p.getAll('oid')[0];
  const ownerAddress = p.getAll('address')[0];
  const gName = p.getAll('gn')[0];

  const { switchNetwork } = useSwitchNetwork();
  const currentTab = tab ? tab : Type.Description;
  const [open, setOpen] = useState(false);

  const handleTabChange = useCallback((tab: any) => {
    navigator(
      `/resource?${p.toString().replace(/tab=([^&]*)/g, `tab=${tab}`)}`,
    );
  }, []);

  const { address } = useAccount();

  const [update, setUpdate] = useState(false);

  const { loading, baseInfo } = useResourceInfo({
    groupId,
    bucketId,
    objectId,
    address: ownerAddress,
    groupName: gName,
    update,
  });
  console.log(groupId, baseInfo);

  const { name, price, url, desc, listed, type, bucketName } = baseInfo;

  const resourceType = objectId || type === 'Data' ? '0' : '1';
  console.log(resourceType, objectId, type);
  const { num } = useCollectionItems(name);

  const { salesVolume } = useSalesVolume(groupId);

  const { listedDate } = useListedDate(groupId);

  const { status } = useStatus(gName, ownerAddress, address as string);

  const [showEdit, setShowEdit] = useState(false);

  const showBuy = useMemo(() => {
    return status == 1 || status == -1;
  }, [status, address]);

  console.log(showBuy, status, address);
  const modalData = useModal();

  useEffect(() => {
    return () => {
      navItems.length > 1 && navItems.pop();
    };
  }, []);

  if (loading) return <Loader></Loader>;

  if ((address === ownerAddress || status == 2) && resourceType === '1') {
    navItems[1] = {
      name: 'DataList',
      key: Type.DataList,
    };
  }

  return (
    <Container>
      <ResourceInfo gap={20}>
        <ImgCon
          onMouseMove={() => {
            if (address === ownerAddress) {
              setShowEdit(true);
            }
          }}
          onMouseLeave={() => {
            if (address === ownerAddress) {
              setShowEdit(false);
            }
          }}
          onClick={() => {
            if (address === ownerAddress) {
              setOpen(true);
            }
          }}
        >
          <img src={url || defaultImg(name, 246)} alt="" />
          {showEdit && (
            <EditCon alignItems={'center'} justifyContent={'center'}>
              <PenIcon />
            </EditCon>
          )}
        </ImgCon>
        <Info
          gap={4}
          flexDirection={['column', 'column', 'column']}
          justifyContent={'space-around'}
        >
          <NameCon gap={4} alignItems={'center'} justifyContent={'flex-start'}>
            <Name>{name}</Name>
            {resourceType == '1' ? (
              <Tag alignItems={'center'} justifyContent={'center'}>
                Data Collection
              </Tag>
            ) : null}
          </NameCon>
          {resourceType == '1' ? <ItemNum>{num} Items</ItemNum> : null}
          <OwnCon>
            Created by{' '}
            {address === ownerAddress ? (
              <span>You</span>
            ) : (
              <span>{trimLongStr(ownerAddress)}</span>
            )}{' '}
            At {formatDateUTC(listedDate * 1000)}
          </OwnCon>
          {listed ? (
            <MarketInfo>{divide10Exp(new BN(price, 10), 18)} BNB</MarketInfo>
          ) : null}
          <ActionGroup gap={10}>
            {address === ownerAddress && !listed && (
              <Button
                size={'sm'}
                onClick={async () => {
                  modalData.modalDispatch({
                    type: 'OPEN_LIST',
                    listData: baseInfo,
                  });
                }}
              >
                List
              </Button>
            )}

            <ConnectKitButton.Custom>
              {({ isConnected, show, address, ensName }) => {
                return (
                  showBuy && (
                    <Button
                      size={'sm'}
                      onClick={() => {
                        if (!isConnected) {
                          show?.();
                        } else {
                          modalData.modalDispatch({
                            type: 'OPEN_BUY',
                            buyData: baseInfo,
                          });
                        }
                      }}
                    >
                      Buy
                    </Button>
                  )
                );
              }}
            </ConnectKitButton.Custom>
            {/* {showBuy && (
              <Button
                size={'sm'}
                onClick={() => {
                  modalData.modalDispatch({
                    type: 'OPEN_BUY',
                    buyData: baseInfo,
                  });
                }}
              >
                Buy
              </Button>
            )} */}
            <Button
              size={'sm'}
              onClick={() => {
                window.open(
                  `https://dcellar-qa.fe.nodereal.cc/buckets/${bucketName}`,
                );
              }}
            >
              View in Dcellar
            </Button>
            {listed ? <BoughtNum>{salesVolume} Bought</BoughtNum> : null}
          </ActionGroup>
        </Info>
      </ResourceInfo>
      <Box h={30}></Box>
      <NavBar active={currentTab} onChange={handleTabChange} items={navItems} />
      <Box h={10} w={996}></Box>
      {currentTab === Type.Description ? (
        <Overview
          desc={desc}
          showEdit={address === ownerAddress}
          editFun={() => {
            setOpen(true);
          }}
        ></Overview>
      ) : (
        <List name={name} listed={listed}></List>
      )}
      {open && (
        <EditModal
          isOpen={open}
          handleOpen={() => {
            setOpen(false);
          }}
          detail={{
            ...baseInfo,
            desc,
            url,
          }}
          updateFn={() => {
            setUpdate(true);
          }}
        ></EditModal>
      )}
    </Container>
  );
};

export default Resource;

const Container = styled.div`
  margin-top: 60px;
`;
const ResourceInfo = styled(Flex)``;

const ImgCon = styled.div`
  position: relative;
  width: 246px;
  height: 246px;

  img {
    width: 246px;
    height: 246px;

    background-color: #d9d9d9;
    border-radius: 8px;
  }
`;

const EditCon = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #d9d9d9;

  border-radius: 8px;

  cursor: pointer;
`;

const Info = styled(Flex)``;

const NameCon = styled(Flex)``;

const Name = styled.div`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-size: 32px;
  line-height: 38px;
  /* identical to box height, or 119% */

  color: #f0b90b;
`;

const Tag = styled(Flex)`
  width: 128px;
  height: 24px;

  background: rgba(255, 255, 255, 0.14);
  border-radius: 16px;
`;

const ItemNum = styled.div`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 21px;

  color: #ffffff;
`;

const OwnCon = styled.div`
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 18px;

  color: #ffffff;

  span {
    color: #f0b90b;
  }
`;

const MarketInfo = styled(Flex)`
  color: #f0b90b;
`;

const ActionGroup = styled(Flex)``;

const BoughtNum = styled.div`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 21px;

  color: #979797;
`;