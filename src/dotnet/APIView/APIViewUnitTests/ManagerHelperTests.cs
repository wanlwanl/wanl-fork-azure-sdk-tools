using APIViewWeb;
using APIViewWeb.Helpers;
using Xunit;
using APIViewWeb.LeanModels;

namespace APIViewUnitTests
{
    public class ManagerHelperTests
    {
        [Fact]
        public void UpdateChangeHistory_Behaves_As_Expected()
        {
            var review = new ReviewListItemModel();
            Assert.Empty(review.ChangeHistory);

            // test_User_1 approves
            var updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_1", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Single(review.ChangeHistory);
            Assert.True(updateResult.ChangeStatus);

            // test_User_1 reverts approval
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_1", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(2, review.ChangeHistory.Count);
            Assert.False(updateResult.ChangeStatus);

            // test_User_2 Closed
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Closed, ReviewChangeAction.ReOpened, "test_User_2", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(3, review.ChangeHistory.Count);
            Assert.True(updateResult.ChangeStatus);

            // test_User_2 approves
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_2", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(4, review.ChangeHistory.Count);
            Assert.True(updateResult.ChangeStatus);

            // test_User_3 approves 
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_3", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(5, review.ChangeHistory.Count);
            Assert.True(updateResult.ChangeStatus);

            // test_User_3 reverts approval 
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_3", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(6, review.ChangeHistory.Count);
            Assert.True(updateResult.ChangeStatus);

            // test_User_2 reverts approval
            updateResult = ManagerHelpers.UpdatBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, ReviewChangeAction.ApprovalReverted, "test_User_2", "test_note");
            review.ChangeHistory = updateResult.ChangeHistory;
            Assert.Equal(7, review.ChangeHistory.Count);
            Assert.False(updateResult.ChangeStatus);

            Assert.True(review.ChangeHistory[0].ChangeAction == ReviewChangeAction.Approved && review.ChangeHistory[0].User == "test_User_1");
            Assert.True(review.ChangeHistory[1].ChangeAction == ReviewChangeAction.ApprovalReverted && review.ChangeHistory[1].User == "test_User_1");
            Assert.True(review.ChangeHistory[2].ChangeAction == ReviewChangeAction.Closed && review.ChangeHistory[2].User == "test_User_2");
            Assert.True(review.ChangeHistory[3].ChangeAction == ReviewChangeAction.Approved && review.ChangeHistory[3].User == "test_User_2");
            Assert.True(review.ChangeHistory[4].ChangeAction == ReviewChangeAction.Approved && review.ChangeHistory[4].User == "test_User_3");
            Assert.True(review.ChangeHistory[5].ChangeAction == ReviewChangeAction.ApprovalReverted && review.ChangeHistory[5].User == "test_User_3");
            Assert.True(review.ChangeHistory[6].ChangeAction == ReviewChangeAction.ApprovalReverted && review.ChangeHistory[6].User == "test_User_2");
        }
    }
}
