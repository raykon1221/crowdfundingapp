"use client";

import { useReadContract } from "thirdweb/react";
import { client } from "./client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { CROWDFUNDING_FACTORY } from "./constants/contracts";
import CampaignCard from "./components/CampaignCard";

export default function Home() {
  // Get CrowdfundingFactory contract
  const contract = getContract({
    client: client,
    chain: sepolia,
    address: CROWDFUNDING_FACTORY,
  });

 // Get all campaigns deployed from CrowdfundingFactory contract
  const { data: campaigns, isPending } = useReadContract({
    contract,
    method:
      "function getAllCampaign() view returns ((address campaignAddress, address owner, string name, uint256 creationTime)[])",
    params: [],
  });
  // console.log(campaigns);

  return (
    <main className="mx-auto max-w-7xl px-4 mt-4 sm:px-6 lg:px-8">
      <div className="py-10">
        <h1 className="text-4xl font-bold mb-4">Campaigns:</h1>
        <div className="grid grid-cols-3 gap-4">
          {!isPending && campaigns && (
            campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.campaignAddress}
                  campaignAddress={campaign.campaignAddress}
                />
              ))
            ) : (
              <p>No Campaigns</p>
            )
          )}
        </div>
      </div>
    </main>
  );
}

