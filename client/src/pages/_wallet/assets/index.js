// Library Imports
import React, { Component } from "react";
import { connect } from "react-redux";
import { getBalances, getSimplePrice } from "../../../actions";

// Relative Imports
import Page from "../../../components/_layout/page";
import Body from "../../../components/_layout/body";
import Menu from "../../../components/_layout/menu";
import Header from "../../../components/_layout/header";
import Overview from "../../../components/overview";
import Cell from "../../../components/cell";
import CellDisabled from "../../../components/cell_disabled";

import data from "../../../constants/data.js";
import { NO_PRICE } from "../../../reducers/priceHistory";
import { calcValue } from "../../../utility";
import { selectReadableBalance } from "../../../reducers/balance";

class Assets extends Component {
  state = {
    token: data
  };

  componentDidMount() {
    window.scrollTo(0, 0);

    if (this.props.price === NO_PRICE) {
      this.props.getSimplePrice();
    }
  }

  handleState = () => {
    this.setState(state => ({
      status: !state.status
    }));
  };

  renderTokens = () => {
    const { token } = this.state;
    return token.map(data => {
      const { token, ticker, price, change } = data;
      return (
        <CellDisabled
          fullwidth="fullwidth"
          key={token}
          tokenName={token}
          ticker={ticker}
          price={price}
          change={change}
        />
      );
    });
  };

  render() {
    const price =
      this.props.price === NO_PRICE
        ? "--"
        : this.props.price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD"
          });

    const value = calcValue(this.props.readableBalance, this.props.price);

    return (
      <Page>
        <Menu />
        <Body>
          <Header
            title="Available Assets"
            description="Overview of all available Haven Assets"
          />
          <Overview {...this.props.balance} />
          <Cell
            fullwidth="fullwidth"
            key={1}
            tokenName={"Haven"}
            ticker={"XHV"}
            price={price}
            change={value}
          />

          <Header
            title="Coming Soon"
            description="Overview of Haven Assets coming soon"
          />
          {this.renderTokens()}
        </Body>
      </Page>
    );
  }
}

export const mapStateToProps = state => ({
  balance: state.balance,
  readableBalance: selectReadableBalance(state),
  ...state.simplePrice
});

export default connect(
  mapStateToProps,
  { getBalances, getSimplePrice }
)(Assets);
