using System.Runtime.InteropServices;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace APIViewWeb.Account
{
    public class TestAuthHandler :  AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock) : base(options, logger, encoder, clock) { }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "31145988"),
                new Claim(ClaimTypes.Name, "Chidozie Ononiwu (His Righteousness)"),
                new Claim(ClaimConstants.Login, "chidozieononiwu"),
                new Claim(ClaimConstants.Url, "https://github.com/chidozieononiwu"),
                new Claim(ClaimConstants.Avatar, "https://avatars.githubusercontent.com/u/31145988?v=4"),
                new Claim(ClaimConstants.Name, "Chidozie Ononiwu (His Righteousness)"),
                new Claim(ClaimConstants.Email,"chononiw@microsoft.com"),
                new Claim(ClaimConstants.Orgs, "Azure"),
            };

            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");
            var result = AuthenticateResult.Success(ticket);

            return Task.FromResult(result);
        }
    }
}
