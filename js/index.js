const dataLocation = "../Data/detected-trafficking.csv";

export function map(el) {
  const width = 800;
  const height = 600;
  const svg = d3.select(el).append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select(el).append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const projection = d3.geoMercator()
    .scale(100)
    .center([0,20])
    .translate([width / 2, height / 2]);

  const data = d3.map();
  const colorScale = d3.scaleThreshold()
    .domain([10, 25, 50, 100, 150, 200])
    .range(d3.schemeBuGn[7]);

  d3.queue()
    .defer(d3.json, "../Data/world.geojson")
    .defer(d3.csv, dataLocation, function(d) { data.set(d.Country, +d[2017])})
    .await(ready);

  function ready(error, topo) {
    svg.append("g")
      .selectAll("path")
      .data(topo.features)
      .enter()
      .append("path")
        .attr("d", d3.geoPath()
          .projection(projection)
        )
        .attr("fill", function (d) {
          d.total = data.get(d.properties.name) || 0;
          return colorScale(d.total);
        })
      .on('mousemove', function (d) {
        if(d.total > 0) {
          tooltip.transition()
            .duration(100)
            .style("opacity", 1);

          tooltip.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px")
            .text(() => `${d.properties.name}: ${d.total}`)
        }
      })
      .on("mouseover", function (d) {
        if(d.total > 0) {
          d3.select(this)
            .style("cursor", "pointer");
        }
      })
      .on("mouseout", function (d, i) {
          tooltip.transition()
            .duration(100)
            .style("opacity", 0);
      });
  }
}


export function bargraph(el) {
  const margin = {top: 30, right: 30, bottom: 70, left: 60},
      width = 460 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  const svg = d3.select(el)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  d3.csv(dataLocation, function(data) {
    const top = data.sort(function(a, b) {
      return d3.descending(+a[2017], +b[2017]);
    }).slice(0, 10);

    const x = d3.scaleBand()
      .range([ 0, width ])
      .domain(top.map(function(d) { return d.Country; }))
      .padding(0.2);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    const y = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return +d[2017]; }))
      .range([ height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.selectAll("bar")
      .data(top)
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.Country); })
        .attr("y", function(d) { return y(d[2017]); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d[2017]); })
        .attr("fill", "#69b3a2")
  })
}



