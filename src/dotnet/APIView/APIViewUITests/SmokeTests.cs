using Xunit;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Edge;

namespace APIViewUITests
{
    public class SmokeTests
    {
        [Fact]
        public void IndexPageShouldLoadOnChrome()
        {
            var options = new EdgeOptions();
            options.BinaryLocation = @"C:\Program Files (x86)\Microsoft\Edge Dev\Application\msedge.exe";
            using (IWebDriver driver = new EdgeDriver(options))
            {
                driver.Navigate().GoToUrl("http://localhost:5000/");
            }
        }
    }
}
