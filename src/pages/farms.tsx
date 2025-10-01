import useAppSettings from "@/application/common/useAppSettings";
import useFarms, { FarmPoolJsonInfo } from "@/application/farms/useFarm";
import Col from "@/components/Col";
import CyberpunkStyleCard from "@/components/CyberpunkStyleCard";
import Grid from "@/components/Grid";
import Link from "@/components/Link";
import List from "@/components/List";
import PageLayout from "@/components/PageLayout";
import Row from "@/components/Row";
import toPubString from "@/functions/format/toMintString";

export default function FarmsPage() {

  return (
    <PageLayout
      contentButtonPaddingShorter
      metaTitle="Farms - BrrrChain"
    >
      <FarmHeader />
      <FarmCard />
    </PageLayout>
  )
}

function FarmHeader() {
  const isMobile = useAppSettings((s) => s.isMobile)
  return isMobile ? null : (
    <Col>
      <Grid className="grid-cols-5 justify-between items-center pb-8 pt-0">
        <div className="text-2xl font-semibold justify-self-start text-white">Farms</div>
      </Grid>
    </Col>
  )
}

function FarmCard() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const farms = useFarms((s) => s.jsonInfos)
  const sortedFarms = farms.sort((a: FarmPoolJsonInfo, b: FarmPoolJsonInfo) => b.tvl - a.tvl)

  return (
    <CyberpunkStyleCard
      haveMinHeight
      wrapperClassName="flex-1 overflow-hidden flex flex-col"
      className="grow p-10 pt-6 pb-4 mobile:px-3 mobile:py-3 w-full flex flex-col h-full"
    >
      {!isMobile && (
        <Row
          type="grid-x"
          className="mb-3 h-12  sticky -top-6 backdrop-filter z-10 backdrop-blur-md bg-[rgba(20,16,65,0.2)] mr-scrollbar rounded-xl mobile:rounded-lg gap-2 grid-cols-[auto,1.5fr,1.2fr,1fr,1fr,auto]">
          <Row className="w-20 pl-9"></Row>
          <Row className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer clickable clickable-filter-effect no-clicable-transform-effect">
            Farm
          </Row>

          <div className=" font-medium self-center text-[#ABC4FF] text-sm">Trading Volume</div>

          <Row className=" font-medium items-center text-[#ABC4FF] text-sm cursor-pointer gap-1  clickable clickable-filter-effect no-clicable-transform-effect">
            Total APR
          </Row>

          <Row className=" font-medium text-[#ABC4FF] text-sm items-center cursor-pointer  clickable clickable-filter-effect no-clicable-transform-effect">
            TVL
          </Row>
        </Row>

      )}
      <List
        items={sortedFarms}
        getItemKey={(info) => toPubString(info.id.toString())}
        className="gap-3 text-[#ABC4FF] flex-1 -mx-2 px-2" /* let scrollbar have some space */
      >
        {(info) => (
          <Row
            type="grid-x"
            className="py-5 mobile:py-4 mobile:px-5 bg-[#04133d] items-stretch gap-2 grid-cols-[auto,1.5fr,1.2fr,1fr,1fr,auto] mobile:grid-cols-[1fr,3fr,1fr] rounded-t-3xl mobile:rounded-t-lg rounded-b-3xl mobile:rounded-b-lg transition-all">
            <Row className="w-20 self-center pl-2">
              <Link href={`${info.extUrl}`} openInNewTab>
                <img src={info.poolType === "meteora" ? "/logo/meteora.svg" : info.poolType === "orca" ? "/logo/orca.png" : "/logo/logo-only-icon.svg"} style={{ width: "32px", height: "32px" }} />
              </Link>
            </Row>
            <Row className="font-medium text-[#ABC4FF] text-sm items-center no-clicable-transform-effect">
              <img src={`/tokens/${info.token0}.png`} style={{ width: "35px", height: "32px" }} />
              <img src={`/tokens/${info.token1}.png`} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
              {info.symbol}
            </Row>

            {!isMobile && <Row className=" font-medium self-center text-[#ABC4FF] text-sm">${info.volume?.toFixed(3)}</Row>}

            {!isMobile && <Row className=" font-medium items-center text-[#ABC4FF] text-sm cursor-pointer gap-1 no-clicable-transform-effect">
              {info.apy}%
            </Row>}

            <Row className=" font-medium text-[#ABC4FF] text-sm items-center cursor-pointer no-clicable-transform-effect">
              ${info.tvl.toFixed(3)}
            </Row>
          </Row>
        )}

      </List>

    </CyberpunkStyleCard>
  )
}