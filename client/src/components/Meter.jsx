import React, { Component } from "react";

const styles = {
  container: {
    backgroundColor: "#2a2a2a",
    color: "#dfdfdf",
    fontFamily: "Symbol",
    height: "40%",
    minHeight: "150px",
    minWidth: "170px",
    width: "25%",
  },
  arc: {
    borderColor: "dfdfdf",
    borderStyle: "solid",
    borderRadius: "9999px 9999px 0 0",
    borderWidth: "20px 20px 0",
    height: "40%",
    margin: "15% auto 2%",
    position: "relative",
    width: "66%",
  },
  value: {
    fontSize: "5vw",
    height: "15%",
    position: "relative",
    textAlign: "center",
    top: "5%",
  },
  min: {
    float: "left",
    fontSize: "1.5vw",
    marginLeft: "10%",
  },
  max: {
    float: "right",
    fontSize: "1.5vw",
    marginRight: "10%",
  },
  needle: {
    backgroundColor: "#2a2a2a",
    bottom: 0,
    height: 20,
    marginLeft: "-13%",
    position: "absolute",
    transformOrigin: "100%",
    transitionDuration: "500ms",
    width: "63%",
  },
  center: {
    backgroundColor: "#dfdfdf",
    borderRadius: "9999px 0 0 9999px",
    height: 4,
    left: "15%",
    position: "relative",
    top: 8,
    width: "76%",
  },
  eye: {
    border: "2px solid #dfdfdf",
    borderRadius: "100%",
    float: "right",
    height: 10,
    position: "relative",
    width: 10,
  },
};

class Meter extends Component {
  valueToDegrees() {
    const total = this.props.max - this.props.min;
    const relValue = this.props.value - this.props.min;
    const degrees = (relValue / total) * 180;
    return degrees;
  }
  validateProps() {
    return (
      this.props.min < this.props.max &&
      this.props.value <= this.props.max &&
      this.props.value >= this.props.min
    );
  }
  render() {
    const unit = this.props.unit + " " || "";
    const value = this.props.value;
    const min = this.props.min;
    const max = this.props.max;
    const transform = { transform: "rotate(" + this.valueToDegrees() + "deg)" };
    const needleStyles = styles.needle;
    // const needleStyles = this.validateProps()
    //   ? Object.assign(styles.needle, transform)
    //   : styles.needle;
    return (
      <div style={styles.container}>
        <h2 style={styles.value}>
          {unit}
          {value}
        </h2>
        <div style={styles.arc}>
          <div style={needleStyles}>
            <div style={styles.center}></div>
            <div style={styles.eye}></div>
          </div>
        </div>
        <span style={styles.min}>
          {unit}
          {min}
        </span>
        <span style={styles.max}>
          {unit}
          {max}
        </span>
      </div>
    );
  }
}

// Meter.propTypes = {
//   min: React.PropTypes.number.isRequired,
//   max: React.PropTypes.number.isRequired,
//   value: React.PropTypes.number.isRequired,
//   unit: React.PropTypes.string,
// };

export default Meter;
