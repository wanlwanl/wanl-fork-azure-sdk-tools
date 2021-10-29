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

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/arm"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/CreateADiskAccess.json
func ExampleDiskAccessesClient_BeginCreateOrUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	poller, err := client.BeginCreateOrUpdate(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		golang.DiskAccess{
			Resource: golang.Resource{
				Location: to.StringPtr("<location>"),
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
	log.Printf("DiskAccess.ID: %s\n", *res.ID)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/UpdateADiskAccess.json
func ExampleDiskAccessesClient_BeginUpdate() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	poller, err := client.BeginUpdate(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		golang.DiskAccessUpdate{
			Tags: map[string]*string{
				"department": to.StringPtr("Development"),
				"project":    to.StringPtr("PrivateEndpoints"),
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
	log.Printf("DiskAccess.ID: %s\n", *res.ID)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/GetInformationAboutADiskAccessWithPrivateEndpoints.json
func ExampleDiskAccessesClient_Get() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	res, err := client.Get(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("DiskAccess.ID: %s\n", *res.ID)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/DeleteADiskAccess.json
func ExampleDiskAccessesClient_BeginDelete() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	poller, err := client.BeginDelete(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/ListDiskAccessesInAResourceGroup.json
func ExampleDiskAccessesClient_ListByResourceGroup() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	pager := client.ListByResourceGroup("<resource-group-name>",
		nil)
	for pager.NextPage(ctx) {
		if err := pager.Err(); err != nil {
			log.Fatalf("failed to advance page: %v", err)
		}
		for _, v := range pager.PageResponse().Value {
			log.Printf("DiskAccess.ID: %s\n", *v.ID)
		}
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/ListDiskAccessesInASubscription.json
func ExampleDiskAccessesClient_List() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	pager := client.List(nil)
	for pager.NextPage(ctx) {
		if err := pager.Err(); err != nil {
			log.Fatalf("failed to advance page: %v", err)
		}
		for _, v := range pager.PageResponse().Value {
			log.Printf("DiskAccess.ID: %s\n", *v.ID)
		}
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/GetDiskAccessPrivateLinkResources.json
func ExampleDiskAccessesClient_GetPrivateLinkResources() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	_, err = client.GetPrivateLinkResources(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/ApprovePrivateEndpointConnection.json
func ExampleDiskAccessesClient_BeginUpdateAPrivateEndpointConnection() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	poller, err := client.BeginUpdateAPrivateEndpointConnection(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		"<private-endpoint-connection-name>",
		golang.PrivateEndpointConnection{
			Properties: &golang.PrivateEndpointConnectionProperties{
				PrivateLinkServiceConnectionState: &golang.PrivateLinkServiceConnectionState{
					Description: to.StringPtr("<description>"),
					Status:      golang.PrivateEndpointServiceConnectionStatusApproved.ToPtr(),
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
	log.Printf("PrivateEndpointConnection.ID: %s\n", *res.ID)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/GetInformationAboutAPrivateEndpointConnection.json
func ExampleDiskAccessesClient_GetAPrivateEndpointConnection() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	res, err := client.GetAPrivateEndpointConnection(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		"<private-endpoint-connection-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("PrivateEndpointConnection.ID: %s\n", *res.ID)
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/DeleteAPrivateEndpointConnection.json
func ExampleDiskAccessesClient_BeginDeleteAPrivateEndpointConnection() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	poller, err := client.BeginDeleteAPrivateEndpointConnection(ctx,
		"<resource-group-name>",
		"<disk-access-name>",
		"<private-endpoint-connection-name>",
		nil)
	if err != nil {
		log.Fatal(err)
	}
	_, err = poller.PollUntilDone(ctx, 30*time.Second)
	if err != nil {
		log.Fatal(err)
	}
}

// x-ms-original-file: specification/compute/resource-manager/Microsoft.Compute/stable/2020-12-01/examples/ListPrivateEndpointConnectionsInADiskAccess.json
func ExampleDiskAccessesClient_ListPrivateEndpointConnections() {
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		log.Fatalf("failed to obtain a credential: %v", err)
	}
	con := arm.NewDefaultConnection(cred, nil)
	ctx := context.Background()
	client := golang.NewDiskAccessesClient(con,
		"<subscription-id>")
	pager := client.ListPrivateEndpointConnections("<resource-group-name>",
		"<disk-access-name>",
		nil)
	for pager.NextPage(ctx) {
		if err := pager.Err(); err != nil {
			log.Fatalf("failed to advance page: %v", err)
		}
		for _, v := range pager.PageResponse().Value {
			log.Printf("PrivateEndpointConnection.ID: %s\n", *v.ID)
		}
	}
}
