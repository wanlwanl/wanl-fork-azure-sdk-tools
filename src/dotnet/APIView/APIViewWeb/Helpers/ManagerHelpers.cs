using System;
using System.Collections.Generic;
using System.Linq;

namespace APIViewWeb.Helpers
{
    public class ManagerHelpers
    {
        /// <summary>
        /// Given a List of ChangeHistory, and a ChangeAction, update the ChangeHistory with the ChangeAction
        /// depending on the entries already present in the changeHistroy. Return updated ChangeHistory and the ChangeStatus 
        /// which is the overall status of the change Action based on all changes in the changeHistory i.e true if added, false if reverted
        /// Should be used for ChangeActions that are Binary (Added/Reverted) Approved, Delete e.t.c
        /// </summary>
        /// <typeparam name="T1"></typeparam>
        /// <typeparam name="T2"></typeparam>
        /// <param name="changeHistory"></param>
        /// <param name="actionAdded"></param>
        /// <param name="actionReverted"></param>
        /// <param name="user"></param>
        /// <param name="notes"></param>
        /// <returns></returns>
        public static (List<T1> ChangeHistory, bool ChangeStatus) UpdatBinaryChangeAction<T1, T2>(List<T1> changeHistory, T2 actionAdded, T2 actionReverted, string user, string notes)
        {
            var expectedActionReverted = string.Empty;
            switch (actionAdded.ToString())
            {
                case "Approved":
                    expectedActionReverted = "ApprovalReverted";
                    break;
                case "Closed":
                    expectedActionReverted = "ReOpened";
                    break;
                case "Deleted":
                    expectedActionReverted = "Undeleted";
                    break;
            }

            if (actionReverted.ToString() != expectedActionReverted)
            {
                throw new ArgumentException($"Invalid arguments actionAdded : {actionAdded} and / or actionReverted : {actionReverted}");
            }

            var actionsAddedByUser = GetActionsAdded(changeHistory, actionAdded, user);
            var actionsRevertedByUser = GetActionsReverted(changeHistory, actionReverted, user);

            T1 obj = (T1)Activator.CreateInstance(typeof(T1));

            if (actionsAddedByUser.Count() > actionsRevertedByUser.Count())
            {
                obj.GetType().GetProperty("ChangeAction").SetValue(obj, actionReverted);
            }
            else
            {
                obj.GetType().GetProperty("ChangeAction").SetValue(obj, actionAdded);
            }
            obj.GetType().GetProperty("User").SetValue(obj, user);
            obj.GetType().GetProperty("Notes").SetValue(obj, notes);
            obj.GetType().GetProperty("ChangeDateTime").SetValue(obj, DateTime.Now);
            changeHistory.Add(obj);
            
            var actionsAdded = GetActionsAdded(changeHistory, actionAdded);
            var actionsReverted = GetActionsReverted(changeHistory, actionReverted);

            if (actionsAdded.Count() > actionsReverted.Count())
            {
                return (changeHistory, true);
            }
            return (changeHistory, false);
        }

        private static IEnumerable<T1> GetActionsAdded<T1, T2>(List<T1> changeHistory, T2 actionAdded, string user = null)
        {
            return changeHistory.Where(c =>
            {
                var changeAction = c.GetType().GetProperty("ChangeAction").GetValue(c);
                if (String.IsNullOrEmpty(user))
                {
                    return changeAction.Equals(actionAdded);
                }
                var userProperty = c.GetType().GetProperty("User").GetValue(c);
                return changeAction.Equals(actionAdded) && userProperty.Equals(user);
            });
        }

        private static IEnumerable<T1> GetActionsReverted<T1, T2>(List<T1> changeHistory, T2 actionReverted, string user = null)
        {
            return changeHistory.Where(c =>
            {
                var changeAction = c.GetType().GetProperty("ChangeAction").GetValue(c);
                if (String.IsNullOrEmpty(user))
                {
                    return changeAction.Equals(actionReverted);
                }
                var userProperty = c.GetType().GetProperty("User").GetValue(c);
                return changeAction.Equals(actionReverted) && userProperty.Equals(user);
            });
        }
    }
}
