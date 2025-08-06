package feedback

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-backend/config"
	"github.com/azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-backend/model"
	"github.com/azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-backend/service/storage"
	"github.com/xuri/excelize/v2"
)

type FeedbackService struct{}

func NewFeedbackService() *FeedbackService {
	return &FeedbackService{}
}

func (s *FeedbackService) SaveFeedback(feedback model.FeedbackReq) error {
	timestamp := time.Now()
	// Get year and month
	year, month, _ := timestamp.Date()

	// Format: feedback_YYYY_MM.xlsx
	filename := fmt.Sprintf("feedback_%04d_%02d.xlsx", year, int(month))

	// Read file from storage
	storageService, err := storage.NewStorageService()
	if err != nil {
		return fmt.Errorf("failed to create storage service: %w", err)
	}

	var f *excelize.File
	var existingData bool

	// Try to download existing Excel file from storage
	content, err := storageService.DownloadBlob(config.STORAGE_FEEDBACK_CONTAINER, filename)
	if err != nil || len(content) == 0 {
		log.Printf("Failed to download feedback file or file is empty (creating new): %v", err)
		// Create new Excel file
		f = excelize.NewFile()
		existingData = false
	} else {
		// Open the file directly from bytes in memory
		f, err = excelize.OpenReader(bytes.NewReader(content))
		if err != nil {
			return fmt.Errorf("failed to open existing Excel file: %w", err)
		}
		existingData = true
	}

	defer f.Close()

	sheetName := "Feedback"

	// If this is a new file, set up the headers
	if !existingData {
		// Rename default sheet to "Feedback"
		f.SetSheetName("Sheet1", sheetName)

		// Set headers
		headers := []string{"Timestamp", "TenantID", "Messages", "Reaction", "Comment", "Reasons", "Link"}
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue(sheetName, cell, header)
		}
	}

	// Find the next empty row
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("failed to get rows: %w", err)
	}
	nextRow := len(rows) + 1

	// Convert data to JSON bytes for Excel
	reasonBytes, _ := json.Marshal(feedback.Reasons)
	messageBytes, _ := json.Marshal(feedback.Messages)

	// Set the new row data
	rowData := []interface{}{
		timestamp.Format(time.RFC3339),
		feedback.TenantID,
		string(messageBytes),
		feedback.Reaction,
		feedback.Comment,
		string(reasonBytes),
		feedback.Link,
	}

	for i, value := range rowData {
		cell := fmt.Sprintf("%c%d", 'A'+i, nextRow)
		f.SetCellValue(sheetName, cell, value)
	}

	// Write to buffer instead of saving to file
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return fmt.Errorf("failed to write Excel to buffer: %w", err)
	}

	err = storageService.PutBlob(config.STORAGE_FEEDBACK_CONTAINER, filename, buf.Bytes())
	return err
}

// createGitHubIssue creates an issue in the Azure SDK PR repository
func (s *FeedbackService) CreateGitHubIssue(feedback model.FeedbackReq) error {
	// GitHub API endpoint for creating issues
	repoURL := "https://api.github.com/repos/Azure/azure-sdk-pr/issues"

	// Create issue body with the specified template
	issueBody := fmt.Sprintf(`## Root Cause
TODO

## Reasons
reasons that are chosen in Teams
%s

## Comment
The comment filled in by customer
%s

## Link
The link to the conversation
%s`,
		formatReasonsForIssue(feedback.Reasons),
		feedback.Comment,
		feedback.Link,
	)

	// Extract summary from comment for title
	summary := extractSummary(feedback.Comment)

	// Create GitHub issue payload
	issuePayload := map[string]interface{}{
		"title":  fmt.Sprintf("[Teams Chatbot]: %s", summary),
		"body":   issueBody,
		"labels": []string{"Chatbot Feedback"},
	}

	payloadBytes, err := json.Marshal(issuePayload)
	if err != nil {
		return fmt.Errorf("failed to marshal issue payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", repoURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Azure-SDK-Bot")

	// TODO: Add GitHub token authentication
	// req.Header.Set("Authorization", "token YOUR_GITHUB_TOKEN")

	// Send request (commented out to avoid actual API calls without proper auth)
	// client := &http.Client{Timeout: 30 * time.Second}
	// resp, err := client.Do(req)
	// if err != nil {
	//     return fmt.Errorf("failed to create GitHub issue: %w", err)
	// }
	// defer resp.Body.Close()

	log.Printf("GitHub issue would be created for feedback with title: [Teams Chatbot]: %s", summary)
	return nil
}

// formatReasonsForIssue formats the reasons for GitHub issue display
func formatReasonsForIssue(reasons []string) string {
	if len(reasons) == 0 {
		return "N/A"
	}

	var formattedReasons []string
	for _, reason := range reasons {
		formattedReasons = append(formattedReasons, fmt.Sprintf("- %s", reason))
	}

	return strings.Join(formattedReasons, "\n")
}

// extractSummary extracts a summary from the comment for the issue title
func extractSummary(comment string) string {
	if comment == "" {
		return "User feedback"
	}

	// Take first 50 characters as summary
	summary := comment
	if len(summary) > 50 {
		summary = summary[:47] + "..."
	}

	// Remove newlines and extra spaces
	summary = strings.ReplaceAll(summary, "\n", " ")
	summary = strings.ReplaceAll(summary, "\r", " ")
	summary = strings.Join(strings.Fields(summary), " ")

	return summary
}
