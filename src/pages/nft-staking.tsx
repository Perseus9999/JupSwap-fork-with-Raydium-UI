import Col from "@/components/Col";
import Grid from "@/components/Grid";
import PageLayout from "@/components/PageLayout";

export default function NftStakingPage() {

  return (
    <PageLayout
      contentButtonPaddingShorter
      metaTitle="NFT Staking - BrrrChain"
    >
      <Header />
    </PageLayout>
  )
}

function Header() {
  return (
    <Col>
      <Grid className="flex justify-center items-center pb-8 pt-8 mt-4">
        <div className="text-3xl font-semibold justify-center text-white">Coming Soon</div>
      </Grid>
    </Col>
  )
}