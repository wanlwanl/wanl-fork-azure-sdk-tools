using Xunit;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Edge;
using System.Linq;

namespace APIViewUITests
{
    public class SmokeTests
    {
        [Fact]
        public void MostUsedPagesLoadsWithouErrors()
        {
            using (IWebDriver driver = new ChromeDriver())
            {
                driver.Navigate().GoToUrl("http://localhost:5000/");
                Assert.Equal("Reviews - apiview.dev", driver.Title);

                var reviewNames = driver.FindElements(By.ClassName("review-name"));
                reviewNames[17].Click();
                Assert.NotEqual("Error - apiview.dev", driver.Title);

                var navLinks = driver.FindElements(By.ClassName("nav-link"));
                foreach (var navLink in navLinks)
                {
                    if (navLink.Text.Equals("Conversation") || navLink.Text.Equals("Revisions"))
                    {
                        navLink.Click();
                        Assert.NotEqual("Error - apiview.dev", driver.Title);
                        driver.Navigate().Back();
                    }
                }
            }
        }
    }
}
