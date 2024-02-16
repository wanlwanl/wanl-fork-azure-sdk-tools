using YamlDotNet.Serialization;

namespace Azure.Sdk.PipelineTemplateConverter;

public class PublishArtifactTask
{
    [YamlMember()]
    public string? Task { get; set; }

    [YamlMember()]
    public string? DisplayName { get; set; }

    [YamlMember()]
    public string? Condition { get; set; }

    [YamlMember()]
    public TaskInputs Inputs { get; set; } = new TaskInputs();

    public string ArtifactName
    {
        get
        {
            return Inputs.PackagesToPush ?? Inputs.Artifact ?? Inputs.ArtifactName ?? "";
        }
    }

    public string ArtifactPath
    {
        get
        {
            if (Inputs.PackageParentPath != null)
            {
                return Inputs.PackageParentPath;
            }
            if (Inputs.PackagesToPush != null)
            {
                // Hack since packagesToPush is required by the 1es nuget task
                // This assumes ALL our nuget paths use globs
                return Inputs.PackagesToPush.Split("/*")[0];
            }
            return Inputs.Path ?? Inputs.TargetPath ?? Inputs.PathToPublish ?? "";
        }
    }

    public class TaskInputs
    {

        [YamlMember()]
        public string? Artifact { get; set; }
        [YamlMember()]
        public string? ArtifactName { get; set; }

        [YamlMember()]
        public string? Path { get; set; }
        [YamlMember()]
        public string? TargetPath { get; set; }
        [YamlMember()]
        public string? PathToPublish { get; set; }

        // Nuget publish task options
        [YamlMember()]
        public string? PackagesToPush { get; set; }
        [YamlMember()]
        public string? PackageParentPath { get; set; }
        [YamlMember()]
        public string? NugetFeedType { get; set; }
        [YamlMember()]
        public string? PublishVstsFeed { get; set; }
        // Throwaway properties
        [YamlMember()]
        public string? Command { get; set; }
        [YamlMember()]
        public string? PublishFeedCredentials { get; set; }
    }

    public List<string> Convert()
    {
        if (Inputs.PackagesToPush != null)
        {
            return ConvertNuget();
        }
        return ConvertPublish();
    }

    public List<string> ConvertPublish()
    {
        var lines = new List<string>
        {
            $"- template: /eng/common/pipelines/templates/steps/publish-artifact.yml",
            $"  parameters:",
            $"    ArtifactName: {ArtifactName}",
            $"    ArtifactPath: {ArtifactPath}",
        };
        if (DisplayName != null)
        {
            lines.Add($"    DisplayName: {DisplayName}");
        }
        if (Condition != null)
        {
            lines.Add($"    CustomCondition: {Condition}");
        }

        return lines;
    }

    public List<string> ConvertNuget()
    {
        var lines = new List<string>
        {
            $"- task: 1ES.PublishNuget@1",
            $"  inputs:",
            $"    packagesToPush: {ArtifactName}",
            $"    packageParentPath: {ArtifactPath}",
        };

        if (Inputs.NugetFeedType != null)
        {
            lines.Add($"    nuGetFeedType: {Inputs.NugetFeedType}");
        }
        if (Inputs.PublishVstsFeed != null)
        {
            lines.Add($"    publishVstsFeed: {Inputs.PublishVstsFeed}");
        }
        if (DisplayName != null)
        {
            lines.Add($"  displayName: {DisplayName}");
        }
        if (Condition != null)
        {
            lines.Add($"  condition: {Condition}");
        }

        return lines;
    }
}
