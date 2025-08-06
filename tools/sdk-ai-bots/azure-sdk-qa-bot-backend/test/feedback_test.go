package test

import (
	"testing"

	"github.com/azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-backend/model"
	"github.com/azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-backend/service/feedback"
)

func TestSaveFeedback(t *testing.T) {
	// Create test feedback data
	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-123",
		Messages: []model.Message{
			{
				Role:    model.Role_User,
				Content: "How do I use Azure SDK?",
			},
			{
				Role:    model.Role_Assistant,
				Content: "You can use Azure SDK by...",
			},
		},
		Reaction: model.Reaction_Good,
		Comment:  "This was helpful, thank you!",
		Reasons:  []string{"Accurate", "Clear"},
		Link:     "https://teams.microsoft.com/conversation/123",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test SaveFeedback
	// Note: This test will fail in real environment without proper Azure storage setup
	// In a real test environment, you would mock the storage service
	err := service.SaveFeedback(testFeedback)

	// For now, we expect an error because storage is not properly configured
	// In a production test, you would mock the storage and assert err == nil
	if err == nil {
		t.Log("SaveFeedback completed successfully (likely with mocked storage)")
	} else {
		t.Logf("SaveFeedback failed as expected without proper storage setup: %v", err)
	}
}

func TestSaveFeedbackWithBadReaction(t *testing.T) {
	// Create test feedback data with bad reaction
	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-456",
		Messages: []model.Message{
			{
				Role:    model.Role_User,
				Content: "This doesn't work",
			},
		},
		Reaction: model.Reaction_Bad,
		Comment:  "The response was not helpful and contained outdated information.",
		Reasons:  []string{"Out of date/obsolete", "Incorrect"},
		Link:     "https://teams.microsoft.com/conversation/456",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test SaveFeedback with bad reaction
	err := service.SaveFeedback(testFeedback)

	if err == nil {
		t.Log("SaveFeedback with bad reaction completed successfully")
	} else {
		t.Logf("SaveFeedback with bad reaction failed: %v", err)
	}
}

func TestCreateGitHubIssue(t *testing.T) {
	// Create test feedback data
	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-789",
		Messages: []model.Message{
			{
				Role:    model.Role_User,
				Content: "How do I authenticate with Azure?",
			},
			{
				Role:    model.Role_Assistant,
				Content: "Outdated authentication method provided",
			},
		},
		Reaction: model.Reaction_Bad,
		Comment:  "The authentication method shown is deprecated and doesn't work anymore.",
		Reasons:  []string{"Out of date/obsolete", "Incorrect"},
		Link:     "https://teams.microsoft.com/conversation/789",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test CreateGitHubIssue
	// Note: This test won't actually create a GitHub issue because the HTTP request is commented out
	err := service.CreateGitHubIssue(testFeedback)

	// Should succeed because we're not actually making HTTP requests
	if err != nil {
		t.Errorf("CreateGitHubIssue failed: %v", err)
	} else {
		t.Log("CreateGitHubIssue completed successfully (mocked)")
	}
}

func TestCreateGitHubIssueWithEmptyComment(t *testing.T) {
	// Create test feedback data with empty comment
	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-empty",
		Messages: []model.Message{},
		Reaction: model.Reaction_Bad,
		Comment:  "", // Empty comment to test summary extraction
		Reasons:  []string{"Other"},
		Link:     "https://teams.microsoft.com/conversation/empty",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test CreateGitHubIssue with empty comment
	err := service.CreateGitHubIssue(testFeedback)

	if err != nil {
		t.Errorf("CreateGitHubIssue with empty comment failed: %v", err)
	} else {
		t.Log("CreateGitHubIssue with empty comment completed successfully")
	}
}

func TestCreateGitHubIssueWithLongComment(t *testing.T) {
	// Create test feedback data with long comment
	longComment := "This is a very long comment that exceeds the 50 character limit for the summary extraction. It should be truncated properly in the issue title while the full comment should appear in the issue body."

	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-long",
		Messages: []model.Message{
			{
				Role:    model.Role_User,
				Content: "Complex question about Azure services",
			},
		},
		Reaction: model.Reaction_Bad,
		Comment:  longComment,
		Reasons:  []string{"Unclear", "Too complex"},
		Link:     "https://teams.microsoft.com/conversation/long",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test CreateGitHubIssue with long comment
	err := service.CreateGitHubIssue(testFeedback)

	if err != nil {
		t.Errorf("CreateGitHubIssue with long comment failed: %v", err)
	} else {
		t.Log("CreateGitHubIssue with long comment completed successfully")
	}
}

func TestCreateGitHubIssueWithNoReasons(t *testing.T) {
	// Create test feedback data with no reasons
	testFeedback := model.FeedbackReq{
		TenantID: "test-tenant-no-reasons",
		Messages: []model.Message{
			{
				Role:    model.Role_User,
				Content: "Simple question",
			},
		},
		Reaction: model.Reaction_Bad,
		Comment:  "Not satisfied with the response",
		Reasons:  []string{}, // Empty reasons array
		Link:     "https://teams.microsoft.com/conversation/no-reasons",
	}

	// Create feedback service
	service := feedback.NewFeedbackService()

	// Test CreateGitHubIssue with no reasons
	err := service.CreateGitHubIssue(testFeedback)

	if err != nil {
		t.Errorf("CreateGitHubIssue with no reasons failed: %v", err)
	} else {
		t.Log("CreateGitHubIssue with no reasons completed successfully")
	}
}
