package feedback

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
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
	filename := fmt.Sprintf("feedback_%s.xlsx", timestamp.Format("2006-01-02"))

	// Read file from storage
	storageService, err := storage.NewStorageService()
	if err != nil {
		return fmt.Errorf("failed to create storage service: %w", err)
	}

	var f *excelize.File

	// Try to download existing file from storage
	content, err := storageService.DownloadBlob(config.STORAGE_FEEDBACK_CONTAINER, filename)
	if err != nil {
		log.Printf("Failed to download feedback file: %v", err)
	}

	if len(content) > 0 {
		// Load existing Excel file from downloaded content
		f, err = excelize.OpenReader(bytes.NewReader(content))
		if err != nil {
			log.Printf("Failed to open existing Excel file: %v", err)
			// Create new file if we can't open the existing one
			f = excelize.NewFile()
		}
	} else {
		// Create new Excel file
		f = excelize.NewFile()
		// Set headers
		headers := []string{"Timestamp", "TenantID", "Messages", "Reaction", "Comment"}
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue("Sheet1", cell, header)
		}
	}

	// Find the next available row
	rows, err := f.GetRows("Sheet1")
	if err != nil {
		return fmt.Errorf("failed to get rows: %w", err)
	}

	nextRow := len(rows) + 1
	if nextRow == 1 {
		// If file was empty, add headers first
		headers := []string{"Timestamp", "TenantID", "Messages", "Reaction", "Comment"}
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue("Sheet1", cell, header)
		}
		nextRow = 2
	}

	// Prepare the new record data
	messageStr, _ := json.Marshal(feedback.Messages)

	// Add the new record
	f.SetCellValue("Sheet1", fmt.Sprintf("A%d", nextRow), timestamp.Format(time.RFC3339))
	f.SetCellValue("Sheet1", fmt.Sprintf("B%d", nextRow), feedback.TenantID)
	f.SetCellValue("Sheet1", fmt.Sprintf("C%d", nextRow), string(messageStr))
	f.SetCellValue("Sheet1", fmt.Sprintf("D%d", nextRow), feedback.Reaction)
	f.SetCellValue("Sheet1", fmt.Sprintf("E%d", nextRow), feedback.Comment)

	// Save the file locally
	if err := f.SaveAs(filename); err != nil {
		return fmt.Errorf("failed to save Excel file: %w", err)
	}

	// Close the Excel file
	if err := f.Close(); err != nil {
		log.Printf("Failed to close Excel file: %v", err)
	}

	go updateFeedbackFile(filename)
	return nil
}

func updateFeedbackFile(filename string) {
	// read the file
	content, err := os.ReadFile(filename)
	if err != nil {
		fmt.Printf("failed to read feedback file: %v", err)
		return
	}

	// Upload the file
	storageService, err := storage.NewStorageService()
	if err != nil {
		fmt.Printf("failed to create storage service: %v", err)
		return
	}
	if err := storageService.PutBlob(config.STORAGE_FEEDBACK_CONTAINER, filename, content); err != nil {
		fmt.Printf("failed to upload feedback file: %v", err)
		return
	}
}
