//go:build go1.18
// +build go1.18

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
// Code generated by Microsoft (R) AutoRest Code Generator.
// Changes may cause incorrect behavior and will be lost if the code is regenerated.

package test_test

import (
	"context"
	"log"

	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

// Generated from example definition: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/CreateOrUpdateASimpleGalleryApplicationVersion.json
func ExampleGalleryApplicationVersionsClient_BeginCreateOrUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client, err := test.NewGalleryApplicationVersionsClient("{subscription-id}", cred, nil)
	if err != nil {
		log.Fatalf("failed to create client: %v", err)
	}
	poller, err := client.BeginCreateOrUpdate(ctx,
		"myResourceGroup",
		"myGalleryName",
		"myGalleryApplicationName",
		"1.0.0",
		test.GalleryApplicationVersion{
			Location: to.Ptr("West US"),
			Properties: &test.GalleryApplicationVersionProperties{
				PublishingProfile: &test.GalleryApplicationVersionPublishingProfile{
					EndOfLifeDate:      to.Ptr(func() time.Time { t, _ := time.Parse(time.RFC3339Nano, "2019-07-01T07:00:00Z"); return t }()),
					ReplicaCount:       to.Ptr[int32](1),
					StorageAccountType: to.Ptr(test.StorageAccountTypeStandardLRS),
					TargetRegions: []*test.TargetRegion{
						{
							Name:                 to.Ptr("West US"),
							RegionalReplicaCount: to.Ptr[int32](1),
							StorageAccountType:   to.Ptr(test.StorageAccountTypeStandardLRS),
						}},
					ManageActions: &test.UserArtifactManage{
						Install: to.Ptr("powershell -command \"Expand-Archive -Path package.zip -DestinationPath C:\\package\""),
						Remove:  to.Ptr("del C:\\package "),
					},
					Source: &test.UserArtifactSource{
						MediaLink: to.Ptr("https://mystorageaccount.blob.core.windows.net/mycontainer/package.zip?{sasKey}"),
					},
				},
			},
		},
		nil)
	if err != nil {
		log.Fatalf("failed to finish the request: %v", err)
	}
	res, err := poller.PollUntilDone(ctx, nil)
	if err != nil {
		log.Fatalf("failed to pull the result: %v", err)
	}
	// TODO: use response item
	_ = res
}

// Generated from example definition: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/UpdateASimpleGalleryApplicationVersion.json
func ExampleGalleryApplicationVersionsClient_BeginUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client, err := test.NewGalleryApplicationVersionsClient("{subscription-id}", cred, nil)
	if err != nil {
		log.Fatalf("failed to create client: %v", err)
	}
	poller, err := client.BeginUpdate(ctx,
		"myResourceGroup",
		"myGalleryName",
		"myGalleryApplicationName",
		"1.0.0",
		test.GalleryApplicationVersionUpdate{
			Properties: &test.GalleryApplicationVersionProperties{
				PublishingProfile: &test.GalleryApplicationVersionPublishingProfile{
					EndOfLifeDate:      to.Ptr(func() time.Time { t, _ := time.Parse(time.RFC3339Nano, "2019-07-01T07:00:00Z"); return t }()),
					ReplicaCount:       to.Ptr[int32](1),
					StorageAccountType: to.Ptr(test.StorageAccountTypeStandardLRS),
					TargetRegions: []*test.TargetRegion{
						{
							Name:                 to.Ptr("West US"),
							RegionalReplicaCount: to.Ptr[int32](1),
							StorageAccountType:   to.Ptr(test.StorageAccountTypeStandardLRS),
						}},
					ManageActions: &test.UserArtifactManage{
						Install: to.Ptr("powershell -command \"Expand-Archive -Path package.zip -DestinationPath C:\\package\""),
						Remove:  to.Ptr("del C:\\package "),
					},
					Source: &test.UserArtifactSource{
						MediaLink: to.Ptr("https://mystorageaccount.blob.core.windows.net/mycontainer/package.zip?{sasKey}"),
					},
				},
			},
		},
		nil)
	if err != nil {
		log.Fatalf("failed to finish the request: %v", err)
	}
	res, err := poller.PollUntilDone(ctx, nil)
	if err != nil {
		log.Fatalf("failed to pull the result: %v", err)
	}
	// TODO: use response item
	_ = res
}

// Generated from example definition: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/GetAGalleryApplicationVersionWithReplicationStatus.json
func ExampleGalleryApplicationVersionsClient_Get() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client, err := test.NewGalleryApplicationVersionsClient("{subscription-id}", cred, nil)
	if err != nil {
		log.Fatalf("failed to create client: %v", err)
	}
	res, err := client.Get(ctx,
		"myResourceGroup",
		"myGalleryName",
		"myGalleryApplicationName",
		"1.0.0",
		&test.GalleryApplicationVersionsClientGetOptions{Expand: to.Ptr(test.ReplicationStatusTypesReplicationStatus)})
	if err != nil {
		log.Fatalf("failed to finish the request: %v", err)
	}
	// TODO: use response item
	_ = res
}

// Generated from example definition: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/DeleteAGalleryApplicationVersion.json
func ExampleGalleryApplicationVersionsClient_BeginDelete() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client, err := test.NewGalleryApplicationVersionsClient("{subscription-id}", cred, nil)
	if err != nil {
		log.Fatalf("failed to create client: %v", err)
	}
	poller, err := client.BeginDelete(ctx,
		"myResourceGroup",
		"myGalleryName",
		"myGalleryApplicationName",
		"1.0.0",
		nil)
	if err != nil {
		log.Fatalf("failed to finish the request: %v", err)
	}
	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		log.Fatalf("failed to pull the result: %v", err)
	}
}

// Generated from example definition: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/ListGalleryApplicationVersionsInAGalleryApplication.json
func ExampleGalleryApplicationVersionsClient_NewListByGalleryApplicationPager() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client, err := test.NewGalleryApplicationVersionsClient("{subscription-id}", cred, nil)
	if err != nil {
		log.Fatalf("failed to create client: %v", err)
	}
	pager := client.NewListByGalleryApplicationPager("myResourceGroup",
		"myGalleryName",
		"myGalleryApplicationName",
		nil)
	for pager.More() {
		nextResult, err := pager.NextPage(ctx)
		if err != nil {
			log.Fatalf("failed to advance page: %v", err)
		}
		for _, v := range nextResult.Value {
			// TODO: use page item
			_ = v
		}
	}
}
