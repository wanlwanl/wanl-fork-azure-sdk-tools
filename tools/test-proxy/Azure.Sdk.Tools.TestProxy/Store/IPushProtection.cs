namespace Azure.Sdk.Tools.TestProxy.Store
{
    public interface IPushProtection
    {
        public ScanResult Scan(string targetDirectory);
    }
}
