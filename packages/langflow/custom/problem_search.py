from typing import Any, Type
from langflow.custom import Component
from langflow.io import SecretStrInput, Output
from langchain_core.tools import BaseTool, Tool
from pydantic import BaseModel, Field
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase



class ProblemSearchComponent(Component):
    display_name = 'Problem Search'
    description = 'Utility to search for a given problem in the database'

    inputs = [
        SecretStrInput(name="pg_server_url", display_name="PostgreSQL Server Connection String", required=True)
    ]

    outputs = [
        Output(name='tool', display_name='Tool', method='build_tool')
    ]

    def build_tool(self) -> Tool:
        """Builds an Astra DB Collection tool.

        Returns:
            Tool: The built Astra DB tool.
        """
        database_uri = self.pg_server_url

        class ProblemSearchModel(BaseModel):
            problem: str = Field(description='The problem number')


        class ProblemSearchTool(BaseTool):
            """ Tool to search for specific problems in the database """
            name: str = "get_problem_by_number"
            description: str = "Tool that executes SQL query to get a problem by its number"
            args_schema: Type[ProblemSearchModel] = ProblemSearchModel

            def _run(self, problem: str) -> str:
                error = None
                try:
                    database = SQLDatabase.from_uri(database_uri)
                except Exception as e:
                    msg = f"An error occurred while connecting to the database: {e}"
                    raise ValueError(msg) from e
                try:
                    tool = QuerySQLDataBaseTool(db=database)
                    result = tool.run(f"SELECT text FROM bua WHERE problem='{problem}'")
                except Exception as e:
                    result = str(e)
                    error = repr(e)

                if error is not None:
                    return 'Failed to get problem'
                return result

        return ProblemSearchTool()
