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

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/CreateOrUpdateASimpleGalleryImageVersionWithVMAsSource.json
func ExampleGalleryImageVersionsClient_BeginCreateOrUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewGalleryImageVersionsClient("<subscription-id>", cred, nil)
	poller, err := client.BeginCreateOrUpdate(ctx,
		"<resource-group-name>",
		"<gallery-name>",
		"<gallery-image-name>",
		"<gallery-image-version-name>",
		golang.GalleryImageVersion{
			Resource: golang.Resource{
				Location: to.StringPtr("<location>"),
			},
			Properties: &golang.GalleryImageVersionProperties{
				PublishingProfile: &golang.GalleryImageVersionPublishingProfile{
					GalleryArtifactPublishingProfileBase: golang.GalleryArtifactPublishingProfileBase{
						TargetRegions: []*golang.TargetRegion{
							{
								Name: to.StringPtr("<name>"),
								Encryption: &golang.EncryptionImages{
									DataDiskImages: []*golang.DataDiskImageEncryption{
										{
											DiskImageEncryption: golang.DiskImageEncryption{
												DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
											},
											Lun: to.Int32Ptr(0),
										},
										{
											DiskImageEncryption: golang.DiskImageEncryption{
												DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
											},
											Lun: to.Int32Ptr(1),
										}},
									OSDiskImage: &golang.OSDiskImageEncryption{
										DiskImageEncryption: golang.DiskImageEncryption{
											DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
										},
									},
								},
								RegionalReplicaCount: to.Int32Ptr(1),
							},
							{
								Name: to.StringPtr("<name>"),
								Encryption: &golang.EncryptionImages{
									DataDiskImages: []*golang.DataDiskImageEncryption{
										{
											DiskImageEncryption: golang.DiskImageEncryption{
												DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
											},
											Lun: to.Int32Ptr(0),
										},
										{
											DiskImageEncryption: golang.DiskImageEncryption{
												DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
											},
											Lun: to.Int32Ptr(1),
										}},
									OSDiskImage: &golang.OSDiskImageEncryption{
										DiskImageEncryption: golang.DiskImageEncryption{
											DiskEncryptionSetID: to.StringPtr("<disk-encryption-set-id>"),
										},
									},
								},
								RegionalReplicaCount: to.Int32Ptr(2),
								StorageAccountType:   golang.StorageAccountTypeStandardZRS.ToPtr(),
							}},
					},
				},
				StorageProfile: &golang.GalleryImageVersionStorageProfile{
					Source: &golang.GalleryArtifactVersionSource{
						ID: to.StringPtr("<id>"),
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
	log.Printf("Response result: %#v\n", res.GalleryImageVersionsCreateOrUpdateResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/UpdateASimpleGalleryImageVersion.json
func ExampleGalleryImageVersionsClient_BeginUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewGalleryImageVersionsClient("<subscription-id>", cred, nil)
	poller, err := client.BeginUpdate(ctx,
		"<resource-group-name>",
		"<gallery-name>",
		"<gallery-image-name>",
		"<gallery-image-version-name>",
		golang.GalleryImageVersionUpdate{
			Properties: &golang.GalleryImageVersionProperties{
				PublishingProfile: &golang.GalleryImageVersionPublishingProfile{
					GalleryArtifactPublishingProfileBase: golang.GalleryArtifactPublishingProfileBase{
						TargetRegions: []*golang.TargetRegion{
							{
								Name:                 to.StringPtr("<name>"),
								RegionalReplicaCount: to.Int32Ptr(1),
							},
							{
								Name:                 to.StringPtr("<name>"),
								RegionalReplicaCount: to.Int32Ptr(2),
								StorageAccountType:   golang.StorageAccountTypeStandardZRS.ToPtr(),
							}},
					},
				},
				StorageProfile: &golang.GalleryImageVersionStorageProfile{
					Source: &golang.GalleryArtifactVersionSource{
						ID: to.StringPtr("<id>"),
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
	log.Printf("Response result: %#v\n", res.GalleryImageVersionsUpdateResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/GetAGalleryImageVersionWithReplicationStatus.json
func ExampleGalleryImageVersionsClient_Get() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewGalleryImageVersionsClient("<subscription-id>", cred, nil)
	res, err := client.Get(ctx,
		"<resource-group-name>",
		"<gallery-name>",
		"<gallery-image-name>",
		"<gallery-image-version-name>",
		&golang.GalleryImageVersionsGetOptions{Expand: golang.ReplicationStatusTypesReplicationStatus.ToPtr()})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Response result: %#v\n", res.GalleryImageVersionsGetResult)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/DeleteAGalleryImageVersion.json
func ExampleGalleryImageVersionsClient_BeginDelete() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewGalleryImageVersionsClient("<subscription-id>", cred, nil)
	poller, err := client.BeginDelete(ctx,
		"<resource-group-name>",
		"<gallery-name>",
		"<gallery-image-name>",
		"<gallery-image-version-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-09-30/examples/ListGalleryImageVersionsInAGalleryImage.json
func ExampleGalleryImageVersionsClient_ListByGalleryImage() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	ctx := context.Background()
	client := golang.NewGalleryImageVersionsClient("<subscription-id>", cred, nil)
	pager := client.ListByGalleryImage("<resource-group-name>",
		"<gallery-name>",
		"<gallery-image-name>",
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
