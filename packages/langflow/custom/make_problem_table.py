from langflow.custom import Component
from langflow.io import DataFrameInput, Output, SecretStrInput, StrInput
from pandas import DataFrame
import sqlalchemy


class ProblemPopulateComponent(Component):
    display_name = 'Problem Parser'
    description = 'Populate problem SQL table with context'
    name = 'Problem parser'

    inputs = [
        DataFrameInput(display_name='Parsed lines', name='df'),
        SecretStrInput(name="pg_server_url", display_name="PostgreSQL Server Connection String", required=True),
        StrInput(name='table', display_name='Table')
    ]

    outputs = [
        Output(display_name='Resulting dataframe', name='dataframe', method='populate')
    ]

    def populate(self) -> DataFrame:
        # First filter out rows without a problem number
        df = self.df[self.df['text'].str.contains('^\(\d')]

        # Now extrac the problem numbers
        df['problem'] = df['text'].str.extract('(\d+)')

        # Keep only the columns of interest
        df = df[['text', 'problem']]

        # Store the results in the database
        engine = sqlalchemy.create_engine(self.pg_server_url)
        df.to_sql(name=self.table, con=engine)

        return df


