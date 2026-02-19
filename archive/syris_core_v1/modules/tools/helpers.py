def apply_metadata(func, metadata):
    func.__doc__ = f"""
{metadata["description"]}

Args:
    {metadata["input_schema"]}
Returns:
    {metadata["output_schema"]["description"]}
"""
    return func
