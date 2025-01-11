// contract detail page
'use client'

import { client } from "@/app/client";
import { useParams } from "next/navigation";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import TierCard from "@/app/components/TierCard";
import { useState } from "react";
import { ThirdwebContract } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { lightTheme } from "thirdweb/react";

export default function CampaignPage(){
    const account = useActiveAccount();
    const {campaignAddress} = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const contract = getContract({
        client: client,
        chain: sepolia,
        address: campaignAddress as string,
    });


    const { data: name, isPending: isPendingName } = useReadContract({
        contract,
        method: "function name() view returns (string)",
        params: [],
      });

    // console.log(name);

    const { data: description, isPending: isPendingDescription } = useReadContract({
        contract,
        method: "function description() view returns (string)",
        params: [],
    });
    // console.log(description);

    const { data: deadline, isPending: isPendingDeadline } = useReadContract({
        contract,
        method: "function deadline() view returns (uint256)",
        params: [],
    });

    const deadlineDate = new Date(parseInt(deadline?.toString() as string) * 1000);
    // const deadlineDatePassed = deadlineDate < new Date();

    const { data: goal, isPending:isPendingGoal } = useReadContract({
        contract,
        method: "function goal() view returns (uint256)",
        params: [],
    });
    
    const { data: balance, isPending:isPendingBalance } = useReadContract({
        contract,
        method:
            "function getContractBalance() view returns (uint256)",
        params: [],
    });

    const totalBalance = balance?.toString();
    const totalGoal = goal?.toString();
    let balancePercentage = (parseInt(totalBalance as string)/ parseInt(totalGoal as string )) * 100;

    if (balancePercentage >=100){
        balancePercentage = 100;
    }

    const { data: tiers, isPending: isPendingTiers } = useReadContract({
        contract,
        method:
          "function getTiers() view returns ((string name, uint256 amount, uint256 backers)[])",
        params: [],
      });
    
    const { data: owner, isPending: isPendingOwner } = useReadContract({
        contract,
        method: "function owner() view returns (address)",
        params: [],
    });

    const { data: status, isPending: isPendingStatus } = useReadContract({
        contract,
        method:
            "function getCampaignStatus() view returns (uint8)",
        params: [],
    });

    return (
        <div className="mx-auto max-w-7xl px-2 mt-4 sm:px-6 lg:px-8">
            <div className="flex flex-row justify-between items-center">
                {!isPendingName && (
                    <p className="text-4xl font-semibold">{name}</p>
                )}
                {owner === account?.address && (
                    <div className="flex flex-row">
                        {isEditing && (
                            <p className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2">
                                Status:  
                                {status === 0 ? " Active" : 
                                status === 1 ? " Successful" :
                                status === 2 ? " Failed" : "Unknown"}
                            </p>
                        )}
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={() => setIsEditing(!isEditing)}
                        >{isEditing ? "Done" : "Edit"}</button>
                    </div>
                )}
            </div>
            <div className="my-4">
                <p className="text-lg font-semibold">Description:</p>
                <p>{description}</p>
            </div>
            <div className="mb-4">
                <p className="text-lg font-semibold">Deadline</p>
                {!isPendingDeadline && (
                    <p>{deadlineDate.toDateString()}</p>
                )}
            </div>
            {!isPendingBalance && !isPendingGoal &&(
                <div className="mb-4">
                    <p className="text-lg font-semibold">Campaign Goal: ${goal?.toString()}</p>
                    <div className="relative w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div className="h-6 bg-blue-600 rounded-full dark:bg-blue-500 text-right" style={{ width: `${balancePercentage?.toString()}%`}}>
                            <p className="text-white dark:text-white text-xs p-1">${balance?.toString()}</p>
                        </div>
                        <p className="absolute top-0 right-0 text-white dark:text-white text-xs p-1">
                            {balancePercentage >= 100 ? "" : `${balancePercentage?.toString()}%`}
                        </p>
                    </div>
                </div>
                
            )}
            <div>
                {/* Display Tiers */}
                <p className="text-lg font-semibold">Tiers:</p>
                <div className="grid grid-cols-3 gap-4">
                    {isPendingTiers ? (
                        <p >Loading...</p>
                    ) : (
                        tiers && tiers.length > 0 ? ( // Tiers must be grater than 0
                            tiers.map((tier, index) => (
                                <TierCard
                                    key={index}
                                    tier={tier}
                                    index={index}
                                    contract={contract}
                                    isEditing={isEditing}
                                />
                            ))
                        ) : (
                            !isEditing && (
                                <p>No tiers available</p>
                            )
                        )
                    )}
                    {isEditing && (
                        // Add a button card with text centered in the middle
                        <button
                            className="max-w-sm flex flex-col text-center justify-center items-center font-semibold p-6 bg-blue-500 text-white border border-slate-100 rounded-lg shadow"
                            onClick={() => setIsModalOpen(true)}
                        >+ Add Tier</button>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <CreateCampaignModal
                    setIsModalOpen={setIsModalOpen}
                    contract={contract}
                />
            )}
        </div>
    );
}

type CreateTierModalProps = {
    setIsModalOpen: (value: boolean) => void
    contract: ThirdwebContract
}

const CreateCampaignModal = (
    { setIsModalOpen, contract }: CreateTierModalProps ) => {

    const [tierName, setTierName] = useState<string>("");
    const [tierAmount, setTierAmount] = useState<bigint>(1n);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md">
            <div className="w-1/2 bg-slate-100 p-6 rounded-md">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-semibold">Create a Funding Tier</p>
                    <button
                        className="text-sm px-4 py-2 bg-slate-600 text-white rounded-md"
                        onClick={() => setIsModalOpen(false)}
                    >Close</button>
                </div>
                <div className="flex flex-col">
                    <label>Tier Name:</label>
                    <input 
                        type="text" 
                        value={tierName}
                        onChange={(e) => setTierName(e.target.value)}
                        placeholder="Tier Name"
                        className="mb-4 px-4 py-2 bg-slate-200 rounded-md"
                    />
                    <label>Tier Cost:</label>
                    <input 
                        type="number"
                        value={parseInt(tierAmount.toString())}
                        onChange={(e) => setTierAmount(BigInt(e.target.value))}
                        className="mb-4 px-4 py-2 bg-slate-200 rounded-md"
                    />
                    <TransactionButton
                        transaction={() => prepareContractCall({
                            contract,
                            method:
                              "function addTier(string _name, uint256 _amount)",
                            params: [tierName, tierAmount],
                          })}
                        onTransactionConfirmed={async () => {
                            alert("Tier added successfully!")
                            setIsModalOpen(false)
                        }}
                        onError={(error) => alert(`Error: ${error.message}`)}
                        theme={lightTheme()}
                    >Add Tier</TransactionButton>
                </div>
            </div>
        </div>
    )
}