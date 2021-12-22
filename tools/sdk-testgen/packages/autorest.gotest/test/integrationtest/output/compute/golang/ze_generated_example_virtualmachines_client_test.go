//go:build go1.16
// +build go1.16

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
// Code generated by Microsoft (R) AutoRest Code Generator.
// Changes may cause incorrect behavior and will be lost if the code is regenerated.

package golang_test

import (
	"context"
	"log"

	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/ListVirtualMachinesInASubscriptionByLocation.json
func ExampleVirtualMachinesClient_ListByLocation() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	pager := client.ListByLocation("<location>",
		nil)
	for pager.NextPage(ctx) {
		if err := pager.Err(); err != nil {
			log.Fatalf("failed to advance page: %v", err)
		}
		for _, v := range pager.PageResponse().Value {
			log.Printf("Pager result: %#v\n", v)
		}
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/CreateALinuxVmWithPatchSettingAssessmentModeOfImageDefault.json
func ExampleVirtualMachinesClient_BeginCreateOrUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginCreateOrUpdate(ctx,
		"<resource-group-name>",
		"<vm-name>",
		golang.VirtualMachine{
			Location: to.StringPtr("<location>"),
			Properties: &golang.VirtualMachineProperties{
				HardwareProfile: &golang.HardwareProfile{
					VMSize: golang.VirtualMachineSizeTypesStandardD2SV3.ToPtr(),
				},
				NetworkProfile: &golang.NetworkProfile{
					NetworkInterfaces: []*golang.NetworkInterfaceReference{
						{
							ID: to.StringPtr("<id>"),
							Properties: &golang.NetworkInterfaceReferenceProperties{
								Primary: to.BoolPtr(true),
							},
						}},
				},
				OSProfile: &golang.OSProfile{
					AdminPassword: to.StringPtr("<admin-password>"),
					AdminUsername: to.StringPtr("<admin-username>"),
					ComputerName:  to.StringPtr("<computer-name>"),
					LinuxConfiguration: &golang.LinuxConfiguration{
						PatchSettings: &golang.LinuxPatchSettings{
							AssessmentMode: golang.LinuxPatchAssessmentModeImageDefault.ToPtr(),
						},
						ProvisionVMAgent: to.BoolPtr(true),
					},
				},
				StorageProfile: &golang.StorageProfile{
					ImageReference: &golang.ImageReference{
						Offer:     to.StringPtr("<offer>"),
						Publisher: to.StringPtr("<publisher>"),
						SKU:       to.StringPtr("<sku>"),
						Version:   to.StringPtr("<version>"),
					},
					OSDisk: &golang.OSDisk{
						Name:         to.StringPtr("<name>"),
						Caching:      golang.CachingTypesReadWrite.ToPtr(),
						CreateOption: golang.DiskCreateOptionTypesFromImage.ToPtr(),
						ManagedDisk: &golang.ManagedDiskParameters{
							StorageAccountType: golang.StorageAccountTypesPremiumLRS.ToPtr(),
						},
					},
				},
			},
		},
		nil)
	if err != nil {
		log.Fatal(err)
	}
	res, err := poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesCreateOrUpdateResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/UpdateVMDetachDataDiskUsingToBeDetachedProperty.json
func ExampleVirtualMachinesClient_BeginUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginUpdate(ctx,
		"<resource-group-name>",
		"<vm-name>",
		golang.VirtualMachineUpdate{
			Properties: &golang.VirtualMachineProperties{
				HardwareProfile: &golang.HardwareProfile{
					VMSize: golang.VirtualMachineSizeTypesStandardD2V2.ToPtr(),
				},
				NetworkProfile: &golang.NetworkProfile{
					NetworkInterfaces: []*golang.NetworkInterfaceReference{
						{
							ID: to.StringPtr("<id>"),
							Properties: &golang.NetworkInterfaceReferenceProperties{
								Primary: to.BoolPtr(true),
							},
						}},
				},
				OSProfile: &golang.OSProfile{
					AdminPassword: to.StringPtr("<admin-password>"),
					AdminUsername: to.StringPtr("<admin-username>"),
					ComputerName:  to.StringPtr("<computer-name>"),
				},
				StorageProfile: &golang.StorageProfile{
					DataDisks: []*golang.DataDisk{
						{
							CreateOption: golang.DiskCreateOptionTypesEmpty.ToPtr(),
							DiskSizeGB:   to.Int32Ptr(1023),
							Lun:          to.Int32Ptr(0),
							ToBeDetached: to.BoolPtr(true),
						},
						{
							CreateOption: golang.DiskCreateOptionTypesEmpty.ToPtr(),
							DiskSizeGB:   to.Int32Ptr(1023),
							Lun:          to.Int32Ptr(1),
							ToBeDetached: to.BoolPtr(false),
						}},
					ImageReference: &golang.ImageReference{
						Offer:     to.StringPtr("<offer>"),
						Publisher: to.StringPtr("<publisher>"),
						SKU:       to.StringPtr("<sku>"),
						Version:   to.StringPtr("<version>"),
					},
					OSDisk: &golang.OSDisk{
						Name:         to.StringPtr("<name>"),
						Caching:      golang.CachingTypesReadWrite.ToPtr(),
						CreateOption: golang.DiskCreateOptionTypesFromImage.ToPtr(),
						ManagedDisk: &golang.ManagedDiskParameters{
							StorageAccountType: golang.StorageAccountTypesStandardLRS.ToPtr(),
						},
					},
				},
			},
		},
		nil)
	if err != nil {
		log.Fatal(err)
	}
	res, err := poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesUpdateResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/ForceDeleteVirtualMachine.json
func ExampleVirtualMachinesClient_BeginDelete() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginDelete(ctx,
		"<resource-group-name>",
		"<vm-name>",
		&golang.VirtualMachinesBeginDeleteOptions{ForceDeletion: to.BoolPtr(true)})
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/GetVirtualMachine.json
func ExampleVirtualMachinesClient_Get() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	res, err := client.Get(ctx,
		"<resource-group-name>",
		"<vm-name>",
		&golang.VirtualMachinesGetOptions{Expand: nil})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesGetResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/GetVirtualMachineInstanceView.json
func ExampleVirtualMachinesClient_InstanceView() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	res, err := client.InstanceView(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesInstanceViewResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/GeneralizeVirtualMachine.json
func ExampleVirtualMachinesClient_Generalize() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	_, err = client.Generalize(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/ListAvailableVmSizes_VirtualMachines.json
func ExampleVirtualMachinesClient_ListAvailableSizes() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	res, err := client.ListAvailableSizes(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesListAvailableSizesResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/ReapplyVirtualMachine.json
func ExampleVirtualMachinesClient_BeginReapply() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginReapply(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/ReimageVirtualMachine.json
func ExampleVirtualMachinesClient_BeginReimage() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginReimage(ctx,
		"<resource-group-name>",
		"<vm-name>",
		&golang.VirtualMachinesBeginReimageOptions{Parameters: &golang.VirtualMachineReimageParameters{
			TempDisk: to.BoolPtr(true),
		},
		})
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/RetrieveBootDiagnosticsDataVirtualMachine.json
func ExampleVirtualMachinesClient_RetrieveBootDiagnosticsData() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	res, err := client.RetrieveBootDiagnosticsData(ctx,
		"<resource-group-name>",
		"<vm-name>",
		&golang.VirtualMachinesRetrieveBootDiagnosticsDataOptions{SasURIExpirationTimeInMinutes: to.Int32Ptr(60)})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesRetrieveBootDiagnosticsDataResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/SimulateEvictionOfVM.json
func ExampleVirtualMachinesClient_SimulateEviction() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	_, err = client.SimulateEviction(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/VirtualMachineAssessPatches.json
func ExampleVirtualMachinesClient_BeginAssessPatches() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginAssessPatches(ctx,
		"<resource-group-name>",
		"<vm-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	res, err := poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesAssessPatchesResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/VirtualMachineInstallPatches.json
func ExampleVirtualMachinesClient_BeginInstallPatches() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginInstallPatches(ctx,
		"<resource-group-name>",
		"<vm-name>",
		golang.VirtualMachineInstallPatchesParameters{
			MaximumDuration: to.StringPtr("<maximum-duration>"),
			RebootSetting:   golang.VMGuestPatchRebootSettingIfRequired.ToPtr(),
			WindowsParameters: &golang.WindowsParameters{
				ClassificationsToInclude: []*golang.VMGuestPatchClassificationWindows{
					golang.VMGuestPatchClassificationWindowsCritical.ToPtr(),
					golang.VMGuestPatchClassificationWindowsSecurity.ToPtr()},
				MaxPatchPublishDate: to.TimePtr(func() time.Time { t, _ := time.Parse(time.RFC3339Nano, "2020-11-19T02:36:43.0539904+00:00"); return t }()),
			},
		},
		nil)
	if err != nil {
		log.Fatal(err)
	}
	res, err := poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesInstallPatchesResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2021-03-01/examples/VirtualMachineRunCommand.json
func ExampleVirtualMachinesClient_BeginRunCommand() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewVirtualMachinesClient("<subscription-id>", cred, nil)
	poller, err := client.BeginRunCommand(ctx,
		"<resource-group-name>",
		"<vm-name>",
		golang.RunCommandInput{
			CommandID: to.StringPtr("<command-id>"),
		},
		nil)
	if err != nil {
		log.Fatal(err)
	}
	res, err := poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.VirtualMachinesRunCommandResult)
}
