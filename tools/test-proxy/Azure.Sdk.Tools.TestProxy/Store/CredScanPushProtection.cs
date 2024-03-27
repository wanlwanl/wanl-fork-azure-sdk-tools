namespace Azure.Sdk.Tools.TestProxy.Store
{
    public class ScanResult
    {
        public string DirectoryForScan;
        public bool Success;
    }

    public class CredScanPushProtection : IPushProtection
    {
        public ScanResult Scan(string targetDirectory)
        {
            // todo IMPLEMENT CALLBACK
            return new ScanResult()
            {
                DirectoryForScan = targetDirectory,
                Success = true
            };
        }
    }
}
